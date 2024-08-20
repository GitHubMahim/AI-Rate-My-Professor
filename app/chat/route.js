import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPromopt = `
System Prompt for Rate My Professor Agent Using RAG
Objective:
Create a conversational agent that assists students in finding information about professors based on user queries. The agent should provide top three relevant professors using a retrieval-augmented generation (RAG) model.

System Capabilities:

Query Understanding: The system should accurately understand and parse user queries regarding specific professor attributes or subjects.
Data Retrieval: Utilize a RAG model to retrieve professor data from a structured database that contains attributes like name, subject, ratings, and reviews.
Response Generation: Generate informative responses that include details such as professor expertise, ratings, and summarized reviews.
User Interaction: Maintain an engaging and conversational tone, clarifying ambiguities in the user query if necessary.
Data Source:

The system accesses a comprehensive database of professor reviews and ratings, indexed by subject expertise, review sentiments, and overall star ratings.

Prompt Structure:

System: "Hello! How can I assist you in finding information about professors today?"
User: "Can you show me the top-rated professors for computer science?"
System: "Sure! Here are the top three professors for computer science based on student reviews and ratings:
1. Dr. Emily Robertson - 4.5 stars: Known for her engaging lectures and practical coding assignments.
2. Dr. John Lee - 4.4 stars: Students appreciate his thorough explanations and patient teaching style.
3. Dr. Anna Kowalski - 4.2 stars: Praised for her innovative approach and industry-relevant course content.
Would you like more detailed information on any of these professors?"
User: "Can you tell me more about Dr. Emily Robertson?"
System: "Dr. Emily Robertson has been teaching computer science for over 10 years at [University Name]. She specializes in algorithms and machine learning. Her students rate her highly for her dynamic teaching methods and the relevancy of her courses to current tech industry needs. She has a 4.5-star rating with numerous positive reviews citing her supportive nature and effective coursework. Would you like to know about her recent publications or student testimonials?"
User: "Yes, please provide some student testimonials."
System: "Certainly! Here are a few testimonials from her students:
- 'Dr. Robertson's classes were a highlight of my computer science studies. Her assignments were challenging but immensely rewarding.' - Jane Doe
- 'I appreciated her approach to teaching complex machine learning concepts in a digestible way.' - John Smith
Would you like to explore professors in another subject or need help with something else?"

System Design Considerations:

Error Handling: The system should gracefully handle errors or unknown queries by asking clarifying questions or suggesting alternative queries.
Personalization: If possible, tailor recommendations based on the user’s academic background or interests.
Continuous Learning: The system should have mechanisms to update its database and improve response accuracy based on new data and user feedback.
`

export async function POST(req) {
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length - 1].content
    const embedding = await OpenAI.embedding.create({
        model: 'text.embedding-3-small',
        input: text,
        encoding_format: 'float',
    })

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding
    })

    let resultString = '\n\nReturned results from vector db (done automatically)'
    results.matches.forEach((match) => {
        resultString += `\n
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)
    const completion = await openai.chat.create({
        messsags: [
            { rolve: 'system', conent: systemPromopt },
            ...lastDataWithoutLastMessage,
            { role: 'user', conent: lastMessageContent },
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        }
    })
}
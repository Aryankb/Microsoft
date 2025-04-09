# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
```shell
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 22.14.0
nvm use 22.14.0
npm install -g yarn
yarn install
yarn dev
npm install codemirror@5
yarn add react-codemirror2
```




APACHE SOFTWARE FOUNDATION
GOOGLE SUMMER OF CODE’25

CONTRIBUTOR PROPOSAL FOR PROJECT:-
Implement Agentic GraphRAG Architecture




Aryan Kumar Baghel               
University : International Institute of Information Technology, Naya Raipur
Major: Computer Science and Artificial Intelligence                                                                                         
aryan22102@iiitnr.edu.in
 Github
Linkedin
(+91)7000978867
Timezone : Indian Standard Time (UTC +5:30)

INTRODUCTION
Abstract
Apache HugeGraph is a powerful graph database with excellent OLTP/OLAP capabilities. The hugegraph-llm project aims to bridge the gap between graph systems and Large Language Models, leveraging their complementary strengths to address limitations in both domains.
Problem & Background
This project aims to enhance the existing Graph Retrieval Augmented Generation (GraphRAG) capabilities within Apache HugeGraph by introducing an agentic architecture. The current implementation relies on fixed processing workflows, which lack flexibility and efficiency in complex scenarios. By adopting the principles of "dynamic awareness, lightweight scheduling, concurrent execution," this project will address limitations in intent recognition, resource management, and error handling. The outcome will be a more adaptable and robust GraphRAG system that can better leverage the power of knowledge graphs within large language model applications.
Currently, hugegraph-llm includes a basic GraphRAG implementation.
The identified need is to enhance the flexibility and efficiency of the existing GraphRAG architecture. The current fixed processing workflows lead to inefficiencies in handling diverse and complex queries. Specifically, there are challenges in:
Rigid Intent Recognition: The system uses a static pipeline for knowledge retrieval and graph updates. It struggles to differentiate between simple and complex queries, often resorting to computationally expensive graph traversals even for basic lookups.
Coupled Execution Resources: Resources are not allocated based on task complexity, leading to potential bottlenecks and delays for high-priority tasks due to long-running, less critical operations.
Lack of Feedback Mechanisms: The system lacks the ability to self-correct or adapt in case of errors during the retrieval or processing stages.
Solutions
This project proposes to implement an Agentic GraphRAG architecture in hugegraph-llm. This will involve the development of three core layers:
Dynamic Awareness Layer: An LLM-based intent classifier will categorize user queries in real-time, distinguishing between simple retrieval, path reasoning, graph computation, and more complex tasks. A lightweight operation cache will be implemented for rapid identification of frequent requests.
Task Orchestration Layer: A flexible workflow/taskflow framework (Eg. CrewAI/Llamaindex) will be introduced to manage the execution of tasks. This layer will incorporate a preemptive scheduling mechanism to prioritize critical tasks and allow for the pausing of less important operations.
Concurrent Execution: The traditional RAG pipeline will be decoupled into composable operations (e.g., entity recall -> path validation ->context enhancement -> result refinement). These components can be dynamically enabled/disabled, and fallback strategies will be implemented to handle sub-operation failures.
This agentic architecture will enable the GraphRAG system to dynamically adapt its execution strategy based on the identified intent, optimize resource utilization, and improve robustness through self-correction mechanisms. The project will also focus on providing developers with the tools and APIs to easily integrate these advanced GraphRAG capabilities into their own LLM-powered applications.
We can reuse the existing graph database connectivity and potentially some of the basic retrieval functionalities within hugegraph-llm. However, the core workflow orchestration, intent recognition, and execution management will need to be replaced with the proposed agentic architecture. The existing HugeGraphQAChain interface might serve as a foundational element for integration, but the underlying logic will be significantly enhanced.
The workflow framework will be chosen keeping the focus on providing developers with the flexibility to integrate GraphRAG functionalities into their existing LLM-based applications seamlessly.

ABOUT ME
Educational Background
I am Aryan Kumar Baghel, a third-year undergraduate student majoring in Computer Science and Artificial Intelligence at IIIT-NR, with a strong passion for AI, particularly in the areas of Large Language Models (LLMs), Knowledge Graphs, and their synergistic applications. I have completed courses on Intro to LLMs, NLP, RAG, Big Data and Knowledge Graphs. I hold the position of AI/ML Club head of my college. 
Technical Interests & Projects
My technical skills include proficiency in Python, C++, JavaScript, and database systems like PostgreSQL, MongoDB, ChromaDB, Neo4j, and DynamoDB. I am also experienced with relevant frameworks and technologies such as FastAPI, MLOps tools, RAG pipelines, Git, Docker, Kubernetes, AWS (EC2, DynamoDB, S3), LangGraph, and prompt engineering.
Relevant Projects :-
DEEP-MENTOR: A personalized AI tutor that leverages GraphRAG on uploaded documents. This project involved generating Neo4j queries from LLMs to build a knowledge graph and performing contextual information retrieval, significantly improving response accuracy.
Polkassembly AI Developer: Developing a Python SDK for building autonomous AI agents for Web3 operations, including market analysis and decentralized finance tasks.
Samsung Prism | SIGMOYD: Co-founding and serving as CTO for a project focused on building a platform for creating and deploying AI agentic workflows. This involved fine-tuning LLMs for workflow generation and developing a backend using FastAPI and a React.js frontend.
Prior experience with open source
I actively contribute to the open-source community and have a strong understanding of collaborative development workflows. I have two merged pull requests in Apache HugeGraph, which demonstrates my familiarity with the project's codebase, contribution guidelines, and the community.
Add pr links
I am also an active user of various open-source libraries and frameworks and understand the importance of clear communication, thorough documentation, and adherence to community standards.
Communication 
Working Hours - I am flexible with my timings and can work dedicatedly for hours together. I would like to work during the night-time. Also, I will make sure that GSoC will be my only major commitment this summer and that I give it my full attention. 
Communication preferences - I am most comfortable with the google meet or zoom platform but can adjust to whatever suits the mentors. 
In case of work delay due to personal or other reasons, I assure you that I will work longer and efficiently to complete the backlog in the available time. 
RESUME : Link

Explain doc qna project?


DESIGN/DESCRIPTION OF WORK
Phase 1: Foundational Setup and Dynamic Awareness Layer (Essential)
Set up Development Environment and Familiarization: Thoroughly understand the existing hugegraph-llm codebase, its integration with HugeGraph, and the current GraphRAG implementation. Set up a local development environment with necessary dependencies.
Implement Intent Classifier : Develop an LLM-based intent classifier that can categorize user queries into different levels (L1 simple retrieval, L2 path reasoning, L3 graph computation, L4+ complex tasks) based on semantic features.
Build Lightweight Operation Cache: Implement a simple in-memory cache to store feature hashes of frequently encountered queries and their corresponding intent classifications. This will enable rapid intent matching for recurring requests.
Integrate Intent Classifier with Existing Pipeline: Modify the current GraphRAG pipeline to incorporate the intent classifier. Based on the predicted intent, the system will initially route queries to either a basic retrieval mechanism or a more involved graph traversal.

Phase 2: Task Orchestration Layer 
Research and Select Workflow/Taskflow Framework (Essential): Evaluate potential workflow orchestration frameworks, focusing on low coupling, high performance, and flexibility. Consider options like the flow components of CrewAI or LLamaIndex, as discussed with mentors.
Implement Workflow/Taskflow Integration (Essential): Integrate the chosen framework into the hugegraph-llm project.
Design Preemptive Scheduling Mechanism (Essential): Implement a scheduling system that allows high-priority tasks to preempt non-critical phases of lower-priority tasks. For example, pausing subgraph preloading without interrupting core computations.
Define Task States and Transitions (Essential): Define the different states a task can be in (e.g., pending, running, paused, completed, failed) and the allowed transitions between these states.
Develop API for Task Orchestration (Essential): Create an API to submit tasks, manage their lifecycle (start, pause, resume, cancel), and monitor their status.
(Optional) Implement Execution Trace Tracker: Design and implement a mechanism to log resource consumption (e.g., time, memory) at the micro-operation level within the workflows. This data can be used to generate optimization reports.

Phase 3: Concurrent Execution
Decouple RAG Pipeline into Composable Operations (Essential): Break down the existing GraphRAG pipeline into modular components such as entity recall, path validation, context enhancement, and result refinement.
Implement Dynamic Enable/Disable Support for Components (Essential): Allow for the dynamic enabling and disabling of individual RAG pipeline components based on the identified intent and task requirements.
Implement Automatic Execution Engine Degradation (Essential): Develop fallback strategies that are triggered upon sub-operation failures. For example, switching to alternative query methods if Gremlin queries timeout or trying similar entities if path retrieval fails.
Enhance Retrieval with Graph Algorithms (Essential): Integrate graph algorithms like node importance evaluation (e.g., PageRank) and path search algorithms to optimize knowledge recall based on the query intent and graph structure.
Develop API for Composable Operations (Essential): Provide an API to define and execute custom GraphRAG pipelines by selecting and configuring the composable operations.
(Optional) Implement Dialogue Memory Management Module: Design a module to manage dialogue history and maintain context across multiple turns of interaction, enabling context-aware state tracking and information reuse.
New vs. Modified Components:
New: Dynamic Awareness Layer (Intent Classifier and Cache), Task Orchestration Layer (Workflow Framework and Scheduler), Decoupled and Composable RAG Operations, Automatic Execution Engine Degradation, Enhanced Retrieval with Graph Algorithms, Dialogue Memory Management (Optional), Execution Trace Tracker (Optional).
Modified: Existing GraphRAG pipeline will be refactored into composable operations. APIs will be developed for all new and modified components.
Integration into Existing Architecture:
The new agentic architecture will be designed to integrate seamlessly with the existing hugegraph-llm project. The Dynamic Awareness Layer will act as the entry point for user queries, directing them to the Task Orchestration Layer. The Task Orchestration Layer will then manage the execution of the decoupled RAG operations provided by the Concurrent Execution layer, leveraging the functionalities of Apache HugeGraph for graph data access and querying. The project will aim to maintain a modular design to allow for future extensions and modifications. The HTTP API layer mentioned by the mentors will be crucial for allowing external applications and developers to interact with the new Agentic GraphRAG system.
RESULTS FOR APACHE COMMUNITY
This project will provide significant benefits to the Apache HugeGraph community:
Enhanced Flexibility and Adaptability of GraphRAG: The agentic architecture will enable the GraphRAG system to handle a wider range of user queries and complex scenarios more effectively by dynamically adapting its execution strategy.
Improved Efficiency and Performance: Dynamic resource allocation and preemptive scheduling will optimize resource utilization and reduce latency, particularly for high-priority tasks.
Increased Robustness and Reliability: Automatic fallback strategies and potential self-correction mechanisms will make the GraphRAG system more resilient to failures.
Simplified Integration for Developers: The modular design and well-defined APIs will make it easier for developers to integrate advanced GraphRAG capabilities into their LLM-powered applications.
Foundation for Future Research and Development: The agentic architecture will provide a solid foundation for further research into more sophisticated GraphRAG techniques, including more advanced agent interactions and self-learning capabilities.
Broader Adoption of HugeGraph: By providing a more powerful and flexible GraphRAG solution, this project can attract more users and contributors to the Apache HugeGraph ecosystem.
The legacy of this work will be a more intelligent, efficient, and adaptable GraphRAG system within hugegraph-llm, empowering users to leverage the full potential of knowledge graphs in conjunction with large language models. The modular design and comprehensive documentation will ensure the maintainability and extensibility of the implemented features by the community.
DELIVERABLES
The following deliverables are planned for this project:
Codebase: A fully functional implementation of the Agentic GraphRAG architecture, including the Dynamic Awareness Layer, Task Orchestration Layer, and Concurrent Execution components, integrated into the incubator-hugegraph-llm repository.
Intent Classifier: An LLM-based intent classification model capable of categorizing user queries with an accuracy of >90%.
Workflow/Taskflow Framework Integration: Integration of a suitable workflow orchestration framework.
Decoupled RAG Operations: Implementation of modular and composable RAG pipeline components.
Preemptive Scheduling Mechanism: A functional preemptive scheduler for managing task execution.
Automatic Execution Engine Degradation: Implementation of fallback strategies for sub-operation failures.
Enhanced Retrieval Methods: Integration of graph algorithms for optimized knowledge recall.
Comprehensive Documentation: Detailed documentation of the architecture, design, implementation, and usage of the new Agentic GraphRAG features. This will include API documentation, examples, and tutorials.
Unit and Integration Tests: A comprehensive suite of unit and integration tests to ensure the functionality and stability of the implemented components.
Example Use Cases: Demonstrative examples showcasing the capabilities of the Agentic GraphRAG system in different scenarios.
(Optional) Dialogue Memory Management Module: Implementation of a module for managing dialogue history.
(Optional) Execution Trace Tracker: Implementation of a mechanism for logging and reporting resource consumption.
SCHEDULING
The project is planned for a duration of approximately 16 weeks (350 hours). The following is a rough estimate of the time allocation for each phase:
Weeks 1-2: Project setup, familiarization, research on LLMs and workflow frameworks (30 hours).
Weeks 3-5: Implement the initial version of the LLM-based intent classifier and the lightweight operation cache. (60 hours).
Weeks 6-7: Select and integrate the workflow orchestration framework. Design the basic structure of the Task Orchestration Layer. (40 hours).
Weeks 8-10: Implement the preemptive scheduling mechanism and begin decoupling the existing RAG pipeline into composable operations.(70 hours).
Weeks 11-13: Implementation of Concurrent Execution features (dynamic component enabling, fallback strategies, enhanced retrieval) (90 hours).
Weeks 14-15:  Focus on writing comprehensive documentation, unit and integration tests, and creating example use cases. (50 hours).
Week 16: Final review, bug fixing, and submission (10 hours).
This schedule includes buffer time for unforeseen challenges and bug fixing. I am committed to dedicating sufficient time each week to ensure the project stays on track.
OTHER COMMITMENTS
Currently, my commitments include [Mention any other commitments like part-time work, other projects, etc., and state that they will not significantly impact your ability to dedicate the required time to this GSoC project]. I will prioritize my GSoC project and ensure that I can dedicate the necessary full-time effort (~350 hours) to its successful completion. I do not have any major exams or planned holidays during the GSoC period that would interfere with my work.
COMMUNITY ENGAGEMENTS
I have already engaged with the Apache HugeGraph community through the mailing lists and by submitting pull requests


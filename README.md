
## Project Name

# SIGMOYD

## Description

# Sigmoyd: Prompt-to-Orchestrate Framework

**Live Demo Available**:  [link](https://www.linkedin.com/posts/aryan-kumar-baghel_mcp-ai-agents-activity-7318374132948070401-05bN?utm_source=share&utm_medium=member_android&rcm=ACoAAD0-Z_IBjJa85WAc-O6U2KuucfGZI2hj3c8)
Watch how Sigmoyd searches the latest **LinkedIn job posts**, generates **cold emails**, and sends them instantly to recruiters — **fully automated**!

---

## What is Sigmoyd?

Ever thought of building your own **AI personal assistant** just by writing a **prompt**?

**No code. No drag & drop. Just describe what you want.**

Sigmoyd makes it possible with its powerful **Prompt-to-Orchestrate** framework.
![Image](https://github.com/user-attachments/assets/18eb427c-1d24-43f2-9e3c-99a49a9d7046)
---

## Key Features

### Orchestration Framework  
- Connects any tools (aka *Functions*) with **LLMs** in between  
- In-built **knowledge base** of all tool inputs/outputs  
- Smart orchestration with **zero hallucination workflows**

### MCP Integration  
- **MCP Client Layer**: Discovers and includes tools from any MCP server  
- Add MCP tools to any orchestrated flow seamlessly

### Visual Workflow Execution  
- See **data flow**, **validations**, **iterations**, and **triggers**  
- Gain deep insights into how the workflow runs under the hood

### Trigger & Control Workflows  
- **Auto-triggers**: On Gmail, GitHub, API calls, cron jobs, etc.  
- **Manual run option**  
- Enable/disable workflows dynamically  

### Built-in OAuth Integration  
One-click login for:
- Gmail
- Notion
- Slack
- GitHub
- LinkedIn  
... and more!


---

## Use Cases

- **Customer Support Email arrived**: Classify incoming emails & forward to relevant Slack channels.
- **Collaboration Requests**: Auto-check calendar & reply with a meet link.
- **GitHub Issues Trigger**: Generate suggestions regarding which files to change, what to change.
- **Sales Data Analysis**: Upload CSV → Ask questions → Get insights  

**... and so much more.**  
The possibilities are **limitless** with MCP + Tool integration.


---
## Architecture Diagram
![Image](https://github.com/user-attachments/assets/9079aa9e-9b9d-4776-8089-513708b68094)
![Image](https://github.com/user-attachments/assets/e39fb632-1d31-446b-bf71-dd85f3275a1e)
---

**Follow Sigmoyd** — a robust prompt-to-orchestrate framework.  
Be part of the future of **Agentic AI** & **Workflow Automation**.

---


### Project Repository URL (Frontend)

https://github.com/Aryankb/sigmoyd-frontent

### Deployed Endpoint URL (Beta version releasing soon)

_No response_

### Project Video

https://drive.google.com/file/d/1X0Zo8X7ABYp8_7eBHGHsRqR4HaCZUkVE/view?usp=drivesdk




# Installation Guide

Follow these steps to set up the development environment:

1. Install NVM (Node Version Manager):
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
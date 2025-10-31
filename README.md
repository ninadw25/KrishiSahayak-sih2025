# KrishiSahayak: An AI-Powered Personal Agricultural Advisor

**KrishiSahayak** is an intelligent, agent-based platform that provides hyper-personalized, data-driven advice to farmers, moving them from guesswork to precision agriculture. Our system functions as a complete agricultural assistant, accessible via a simple, conversational chatbot.  

See a complete walkthrough of the application and its features in this video.

https://github.com/user-attachments/assets/84bb06a7-f380-453f-a298-7e44dfe2f779

--

## Core Features

- **Smart Crop Recommendation:** An AI engine that suggests the most profitable and sustainable crops by analyzing soil, weather, market data, and farm history.  
- **Precision Fertilizer Planning:** A predictive model that provides an exact N-P-K (Nitrogen, Phosphorus, Potassium) recommendation tailored to the chosen crop and the farm's specific soil.  
- **AI Pest Detection:** An on-the-fly computer vision tool that identifies pests and diseases from a smartphone camera and suggests an appropriate remedy.  
- **Real-Time Market Analysis:** A time-series forecasting model that provides live mandi prices and predicts short-term price trends to help farmers decide the best time to sell.  
- **Intelligent Q&A Chatbot:** The central interface that allows farmers to ask complex, natural language questions and get answers from all our integrated tools.  

---

## Technical Architecture

Our system is built on a sophisticated **Agentic AI Workflow** that allows a central *Orchestrator* to intelligently manage a suite of specialized tools.  

- **Central AI Engine (Orchestrator):** A core AI engine parses the farmer's natural language query (e.g., “What should I plant?”) to understand their intent and available parameters.  
- **Multi-Tool Integration:** The engine intelligently routes the query to the correct specialized tool:  
  - **ML Models:** For crop, fertilizer, or pest predictions.  
  - **Live APIs:** For real-time weather forecasts and market prices.  
  - **Database:** To fetch the farm's unique soil health profile.  
  - **RAG Knowledge Base:** For general, non-predictive questions.  
- **RAG-Powered Knowledge Base:** For general queries (“How to manage aphids?”), a Retrieval-Augmented Generation (RAG) system searches a vector database of trusted agricultural guides to provide instant, fact-based answers.  
- **Dynamic Farm Twin:** Our most unique feature. We maintain a *Virtual Soil State* for each farmer. After a fertilizer plan is used, the system simulates the impact on the soil. This updated soil state becomes the baseline for the next season’s recommendations, creating a dynamic feedback loop that makes the advice progressively smarter over time.  

---

## Core Models & Technology Stack

| Component | Technology | Purpose |
|------------|-------------|----------|
| **Backend** | Python, FastAPI | Serves the AI agent, models, and APIs at high speed. |
| **Frontend** | React Native | Cross-platform mobile application for Android & iOS. |
| **AI Agent** | LLM (Orchestrator), RAG, Vector DB (Chroma) | Manages the entire agentic workflow and conversational AI. |
| **Database** | PostgreSQL / MongoDB | Stores user profiles and the "Virtual Soil State" for each farm. |
| **Crop Yield Prediction** | XGBoost | Trained on 35,000+ data points (fusing soil, weather, & historical yield). |
| **Fertilizer Recommendation** | RandomForest Classifier | Trained on a synthetically generated dataset to select the optimal fertilizer type. |
| **Market Price Forecasting** | SARIMA | A time-series analysis model to forecast near-term mandi prices. |
| **Pest Detection** | YOLOv8 & OpenCV | A computer vision model trained to identify common Indian crop pests from images. |

---

## Future Scope

- **Full Multilingual Support:** Expanding the chatbot's voice and text capabilities to over 12 regional languages.  
- **IoT Sensor Integration:** Allowing the system to ingest real-time, on-field soil data from IoT hardware for the ultimate level of precision.  
- **Offline Model Deployment:** Converting and deploying core ML models directly on-device using ONNX for full offline functionality.  

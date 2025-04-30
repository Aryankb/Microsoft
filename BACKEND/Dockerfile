# Use an official Python runtime as a parent image
FROM python:3.10

# Set the working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project to the container
COPY . .

# Set PYTHONPATH to include Agentic directory
ENV PYTHONPATH="/app/Agentic"

# Expose the port Uvicorn will run on
EXPOSE 8000

# Start the application
CMD ["uvicorn", "create_agents:app", "--host", "0.0.0.0", "--port", "8000"]

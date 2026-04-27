FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
# Shell form so $PORT is expanded by Railway at runtime
CMD uvicorn main:app --host 0.0.0.0 --port $PORT

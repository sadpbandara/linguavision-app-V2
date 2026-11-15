# Python 3.11 භාවිතා කිරීම
FROM python:3.11-slim

# Working directory එක සැකසීම
WORKDIR /app

# පරිසර විචල්‍යයන් (Environment variables)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# අවශ්‍ය පද්ධති ගොනු ස්ථාපනය
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && apt-get clean

# අවශ්‍ය Python packages ස්ථාපනය
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install gunicorn psycopg2-binary

# කේතය කොපි කිරීම
COPY . /app/

# Port එක විවෘත කිරීම
EXPOSE 8000

# Gunicorn හරහා Server එක ධාවනය කිරීම
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
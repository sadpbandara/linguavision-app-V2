from .models import Exam, Question, Choice, ExamAttempt
from rest_framework import serializers

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text','is_correct'] # is_correct යවන්නේ නැත (ළමයින්ට පිළිතුර හොරෙන් බැලිය නොහැකි වීමට)

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = ['id', 'section', 'text', 'image', 'audio', 'choices']

class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    class Meta:
        model = Exam
        fields = ['id', 'title', 'description', 'time_limit_minutes', 'questions']

class ExamAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAttempt
        fields = '__all__'
from .models import Exam, Question, Choice, ExamAttempt
from django.contrib import admin

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4 # එක ප්‍රශ්නයකට පිළිතුරු 4ක් සඳහා ඉඩ ලබාදීම

class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]
    list_display = ['text', 'exam', 'section']
    list_filter = ['exam', 'section']

admin.site.register(Exam)
admin.site.register(Question, QuestionAdmin)
admin.site.register(ExamAttempt)
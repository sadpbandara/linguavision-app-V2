from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, Role

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['full_name', 'avatar', 'streak_days', 'last_study_date']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    roles = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'is_active', 'is_staff','is_approved', 'roles', 'profile', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(write_only=True, max_length=255)

    class Meta:
        model = User
        fields = ['email', 'password', 'full_name']

    def create(self, validated_data):
        # User කෙනෙක් අලුතින් සෑදීම
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        # ඊට අදාළ Profile එක සෑදීම
        UserProfile.objects.create(
            user=user, 
            full_name=validated_data['full_name']
        )
        return user
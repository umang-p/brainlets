from django.urls import path

from . import views

app_name = 'finalfantasyxiv'
urlpatterns = [
	path('', views.coming_soon, name='home'),
]

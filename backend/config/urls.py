from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from api.models import BusRoute, HostelAllocation, HostelRoom, TransportPass, AttendanceRecord, Announcement, Assignment, Book, BookLoan, Course, ExamSchedule, Result, Teacher, TimetableEntry
from api.serializers import AllocationSerializer, BookSerializer, HostelRoomSerializer, LoanSerializer
from api.views import EduTokenView, RegisterView, ResendOtpView, VerifyEmailView, logout, UserAdminViewSet, change_password, health, FeeViewSet, LeaveViewSet, MessageViewSet, NotificationViewSet, StudentViewSet, SubmissionViewSet, make_viewset

router = DefaultRouter()
router.register("students", StudentViewSet, basename="students")
router.register("fees", FeeViewSet, basename="fees")
router.register("submissions", SubmissionViewSet, basename="submissions")
router.register("notifications", NotificationViewSet, basename="notifications")
router.register("leaves", LeaveViewSet, basename="leaves")
router.register("users", UserAdminViewSet, basename="users")
router.register("messages", MessageViewSet, basename="messages")
router.register("busroutes", make_viewset(BusRoute), basename="busroutes")
router.register("buspasses", make_viewset(TransportPass, ("admin",), "student"), basename="buspasses")
router.register("hostelrooms", make_viewset(HostelRoom, serializer=HostelRoomSerializer), basename="hostelrooms")
router.register("hostelstay", make_viewset(HostelAllocation, ("admin",), "student", AllocationSerializer), basename="hostelstay")
router.register("books", make_viewset(Book, serializer=BookSerializer), basename="books")
router.register("loans", make_viewset(BookLoan, ("admin",), "student", LoanSerializer), basename="loans")
staff = ("admin", "teacher")
for prefix, model, write, own in [("courses", Course, ("admin",), None), ("teachers", Teacher, ("admin",), None),
                                  ("results", Result, staff, "student"),
                                  ("announcements", Announcement, staff, None), ("timetable", TimetableEntry, ("admin",), "course"),
                                  ("assignments", Assignment, staff, "course"), ("examschedule", ExamSchedule, ("admin",), "course"), ("attendance", AttendanceRecord, staff, "student")]:
    router.register(prefix, make_viewset(model, write, own), basename=prefix)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("api/auth/resend-otp/", ResendOtpView.as_view(), name="resend-otp"),
    path("api/auth/logout/", logout, name="logout"),
    path("api/auth/change-password/", change_password, name="change-password"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("api/token/", EduTokenView.as_view()),
    path("api/", include(router.urls)),
]

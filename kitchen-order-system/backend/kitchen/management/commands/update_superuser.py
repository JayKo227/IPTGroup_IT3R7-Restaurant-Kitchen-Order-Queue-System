from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Update superuser credentials'

    def handle(self, *args, **options):
        # Change email and password of existing superuser
        try:
            # Try to find superuser by username or just get the first superuser
            superuser = User.objects.filter(is_superuser=True).first()
            if superuser:
                superuser.email = 'Kitchenoqadminuser@example.com'
                superuser.set_password('Kitchneoq2026')
                superuser.save()
                self.stdout.write(self.style.SUCCESS(f'Successfully updated superuser: {superuser.email}'))
            else:
                self.stdout.write(self.style.ERROR('No superuser found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))

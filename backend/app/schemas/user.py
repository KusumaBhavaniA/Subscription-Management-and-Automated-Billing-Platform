from pydantic import BaseModel, EmailStr, model_validator


class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phoneNumber: str
    password: str
    confirmPassword: str
    country: str | None = None
    phoneCode: str | None = None
    acceptTerms: bool

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.password != self.confirmPassword:
            raise ValueError("Passwords do not match")

        if not self.acceptTerms:
            raise ValueError("You must accept the terms and conditions")

        return self


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str | None = None
    country: str | None = None
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str
from pydantic import BaseModel, EmailStr

class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    address: str

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True
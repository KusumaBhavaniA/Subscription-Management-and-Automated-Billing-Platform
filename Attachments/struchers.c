#include <stdio.h>
struct Student {
    int id;
    char name[50];
    int age;
    char department[50];
    int year;
    char address[100];
    char mobile[15];
    int science_marks;
    int math_marks;
    int english_marks;
};

int main() {
struct Student s[1];
     for(int i=0;i<1;i++){
        printf("\nEnter the student details no %d:\n",i+1);
    printf("Enter student ID: ");
    scanf("%d", &s[i].id);
    printf("Enter student name:");
    scanf(" %[^\n]", s[i].name);
    printf("Enter student age: ");
    scanf("%d", &s[i].age);
    printf("Enter student department: ");
    scanf(" %[^\n]", s[i].department);
    printf("Enter year of study: ");
    scanf("%d", &s[i].year);
    printf("Enter student address: ");
    scanf(" %[^\n]", s[i].address);
    printf("Enter student mobile number: ");
    scanf("%s", s[i].mobile);
    printf("Enter science marks: ");
    scanf("%d", &s[i].science_marks);
    printf("Enter math marks: ");
    scanf("%d", &s[i].math_marks);
    printf("Enter English marks: ");
    scanf("%d", &s[i].english_marks);
}
    printf("\nStudent Details:\n");
     for(int i=0;i<1;i++){
    printf("\n enter the student details %d:\n",i+1);
    printf("ID: %d\n", s[i].id);
    printf("Name: %s\n", s[i].name);
    printf("Age: %d\n", s[i].age);
    printf("Department: %s\n", s[i].department);
    printf("Year of Study: %d\n", s[i].year);
    printf("Address: %s\n", s[i].address);
    printf("Mobile Number: %s\n", s[i].mobile);
    printf("Science Marks: %d\n", s[i].science_marks);
    printf("Math Marks: %d\n", s[i].math_marks);
    printf("English Marks: %d\n", s[i].english_marks);
}
    return 0;
}

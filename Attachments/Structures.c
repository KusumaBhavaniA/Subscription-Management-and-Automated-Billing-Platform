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
struct Student s[2];

for(int i=0;i&lt;=2;i++){
printf(&quot;\nEnter the student details no %d:\n&quot;,i+1);
printf(&quot;Enter student ID: &quot;);
scanf(&quot;%d&quot;, &amp;s[i].id);
printf(&quot;Enter student name: &quot;);
scanf(&quot; %[^\n]&quot;, s[i].name);
printf(&quot;Enter student age: &quot;);
scanf(&quot;%d&quot;, &amp;s[i].age);
printf(&quot;Enter student department: &quot;);
scanf(&quot; %[^\n]&quot;, s[i].department);
printf(&quot;Enter year of study: &quot;);
scanf(&quot;%d&quot;, &amp;s[i].year);
printf(&quot;Enter student address: &quot;);
scanf(&quot; %[^\n]&quot;, s[i].address);
printf(&quot;Enter student mobile number: &quot;);
scanf(&quot;%s&quot;, s[i].mobile);
printf(&quot;Enter science marks: &quot;);
scanf(&quot;%d&quot;, &amp;s[i].science_marks);
printf(&quot;Enter math marks: &quot;);
scanf(&quot;%d&quot;, &amp;s[i].math_marks);
printf(&quot;Enter English marks: &quot;);
scanf(&quot;%d&quot;, &amp;s[i].english_marks);
}
printf(&quot;\nStudent Details:\n&quot;);
for(int i=0;i&lt;=2;i++){
printf(&quot;\n enter the student details %d:\n&quot;,i+1);
printf(&quot;ID: %d\n&quot;, s[i].id);
printf(&quot;Name: %s\n&quot;, s[i].name);
printf(&quot;Age: %d\n&quot;, s[i].age);
printf(&quot;Department: %s\n&quot;, s[i].department);
printf(&quot;Year of Study: %d\n&quot;, s[i].year);

printf(&quot;Address: %s\n&quot;, s[i].address);
printf(&quot;Mobile Number: %s\n&quot;, s[i].mobile);
printf(&quot;Science Marks: %d\n&quot;, s[i].science_marks);
printf(&quot;Math Marks: %d\n&quot;, s[i].math_marks);
printf(&quot;English Marks: %d\n&quot;, s[i].english_marks);
}
return 0;
}

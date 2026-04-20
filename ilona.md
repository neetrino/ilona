**Admin Panel**

1) ## **Dashboard**

The Admin Dashboard must function as a **centralized overview hub**, providing a clear and actionable summary of the entire system in a single view.

It must include the following data blocks:

* **Unpaid Students**  
   A list or counter showing students with outstanding payments, allowing quick access to their profiles.  
* **Groups with Available Capacity**  
   Display groups that still have available slots, enabling quick enrollment decisions.  
* **At-Risk Students**  
   Students labeled as *risk* or *high risk*, based on attendance, payments, and engagement behavior.  
* **Revenue (Super Admin only)**  
   Total income metrics, visible only to users with super admin permissions.  
* **Branch Schedule Overview**  
   A visual or summarized representation of the selected branch’s schedule.

The Dashboard must serve as a **quick decision-making interface**, allowing administrators to access key system insights without navigating into individual modules.

2) **CRM (lead management)** 

The CRM system must be optimized for fast lead intake and structured data collection.

### **UI Changes**

* Replace the **“+” icon** in the “New” column with a **voice icon**, making it more intuitive for quick lead capture.  
* Inside the **“New” column only**, add a **branch selection field** implemented as a dropdown  
   This allows managers to quickly assign a lead to a branch.  
* Based on the selected branch, each manager should only see leads that belong to their assigned branch.

### **Conditional Data Fields**

When adding a student:

- If the student is **under 18 years old**:  
  - Show additional fields:  
    - Parent name  
    - Parent phone number  
    - Parent passport details  
- If the student is **18 or older**:  
  - Show student passport fields instead

### **Additional Fields**

- Add a **Comment field** for internal notes  
- Add a **First Lesson Date field**, allowing admins to specify when the student will attend their first class

### **Automation Logic**

* The **branch field must be pre-filled automatically** based on the “New” column selection  
* When a **group is selected**, the system must automatically assign:  
  * Main teacher  
  * Substitute teacher

based on existing group configuration

3) ## **Centers**

Each center (branch) must be interactive.

Clicking on a center should open a **detailed view (popup or page)** that displays structured information using tabs:

* Teachers  
* Students  
* Groups  
* Schedule  
* Additional relevant branch data

This allows administrators to quickly understand the full state of a specific branch.

## 

4) ## **Groups**

The Groups module must reflect the actual teaching structure.

### **Requirements**

* Each group must display:  
  * Main teacher  
  * Substitute teacher  
     with clear distinction

### **Group Creation**

When creating a group:

- A **schedule (working hours)** must be defined  
- This schedule must be:  
  - Visible in the group card  
  - Accessible when opening the group details

### **Access Control**

* Each manager should only see groups belonging to their assigned branch

## 

5) ## **Teachers** 

The Teachers module must provide better visibility and control over teacher assignments.

### **Column Changes**

* In the **center column**, allow admins to:  
  * Change the assigned branch  
  * Support **multi-select** for assigning multiple centers

  ### **Replace Student Count**

* Remove “number of students”  
* Replace with:  
  * Number of groups assigned  
  * Number of groups where the teacher is a substitute

Clicking this value must open a **popup listing all groups**.

### **Profile Enhancements**

* Add a **video link field** (e.g., YouTube)  
* This video must be visible to students  
* All teacher information (except financial data) must be visible to their students

  ### **Terminology Fix**

* Replace “Hourly Rate” with **“Per Lesson Rate”**, since payment is per lesson, not per hour 

6) ## **Students**

The Students module requires significant improvements for filtering, visibility, and risk management.

### **Status System**

Add the following statuses:

* active  
* inactive  
* ungrouped (students not assigned to any group)  
* new  
* risk  
* high risk

### **Filtering**

* Add **filter by group**

### **Student Profile Access**

**In the Action column:**

* Add a “View” (eye) icon  
* Clicking it should open a full student profile page, structured with tabs:  
  * General Info  
  * Feedback  
  * Payments  
  * Recordings  
  * Attendance  
  * Other related data

### **Additional Fields**

* Add Date of Birth field  
* Age must be calculated automatically and updated yearly

### **Automation**

* When assigning a group:  
  * Automatically assign:  
    * Main teacher  
    * Substitute teacher

### **New Student Handling**

* If a student is transferred from CRM after payment:  
  * Show them at the top of the list  
  * Add a **“new” label**  
  * Include “new” in status options

### **Absence / Risk Logic**

The Absence column must display:

* Total number of absences for the selected period (e.g., current month)

### **Risk Label Logic**

* If a student has more than 1 absence (excused) → assign **“risk” label**  
* If more than 1 absence (unexcused) → assign **“high risk” label**

Labels should be visually displayed under the student name.

Additionally, these labels must also be included in the **status system**.

### **Risk Calculation Factors**

Student risk level must be calculated based on:

* Attendance behavior  
* Payment discipline  
* Recording completion

Students must receive dynamic labels based on these factors.

7) ## **Recordings**

The Recordings module must be redesigned into a **table-based layout**.

### **Columns**

* Checkbox  
* Group  
* Student  
* Date & Time

  ### **Filters**

* Filter by group  
* Filter by student  
* Keyword search  
* Date filter

The current layout is not user-friendly and must be improved for better usability.

8) ## **Schedule**

A **Group Schedule system** must be implemented to provide a clear overview of all classes.

### **Structure**

The schedule must be displayed in a **table/grid format**, including:

* Days of the week (Monday–Sunday)  
* Time slots (e.g., 09:30, 11:30, 15:30)  
* Group name  
* Assigned teacher

### **Purpose**

This feature allows administrators to:

* Quickly understand the full schedule  
* Efficiently manage group distribution

### **Access**

This module must be available to:

* Admin  
* Teacher  
* Manager

## 

9) ## **Calendar**

### **Behavior Rules**

* Teachers must **not be able to create or edit past lessons**  
* This prevents artificial inflation of salary calculations

### **Post-Midnight Editing**

Actions that become locked after 00:00 must:

* Be reopenable by admin or system override  
* Be editable by teachers if needed

However:

* These edits must **not affect financial calculations**, including:  
  * Salary  
  * Deductions  
  * Obligations

### **Views**

Admin must have access to the same views as teachers:

* Week view  
* Month view  
* List view

## **Feedback Form (New Structure)**

Each lesson requires a structured feedback form per student.

### **Fields**

* **Level**\* (A1 / A2 / B1 / B2 / C1)  
* **Grammar**\* (multi-select topics)  
* **Skills** (speaking / writing \+ optional comment)  
* **Comment** (optional)  
* **Participation** (optional toggle → rating appears)  
  * 1 – Quiet Observer  
  * 2 – Steady Presence  
  * 3 – Joining the Flow  
  * 4 – Active Participant  
  * 5 – Brilliant Participant  
* **Progress** (textarea)  
* **Encouragement** (textarea)

## **Daily Plan**

A new action must be added to the Calendar:

* feedback  
* attendance  
* text  
* recording  
* **Daily Plan (NEW)**

### **Functionality**

Teachers must be able to record:

* Topics covered in the lesson  
* Related skills

### **Structure**

Each topic must include:

* Reading (title, link, optional description)  
* Listening (title, link, optional description)  
* Writing (title, link or description)  
* Speaking (title, link or description)

### **Multi-topic Support**

* A **“+” button** must allow adding multiple topic blocks per lesson

### **Standalone Page**

* Daily Plan must also exist as a **separate page in Teacher Panel**  
* Not only inside Calendar

### **Search**

* A dedicated search system must exist within Daily Plan  
* It must search:  
  * Topics  
  * Titles  
  * Skills

⚠️ This search must be independent from global search

10) ## **Absence**

- Rename “Absence” → **“Attendance”**

  ### **Layout**

Convert to a **table format**:

* Students  
* Groups  
* 7-day weekly grid

  ### **Filtering**

* Allow filtering by group

  ### **Data Sync**

Attendance must be fully synchronized with Calendar:

* Changes in one must reflect in the other

  ### **Access**

* Admin → branch-based view  
* Teacher → own groups

11) ## **Finance** 

    ### **Access**

* Must be available to managers (only their branch data)

  ### **Teacher Tab Improvements**

* Add **Deductions column** with total value  
* Show **total lesson count**

  ### **Details View**

* Replace “Lesson Name” with **“Group Name”**  
* Move final totals to the **top of the page**, making them more visible  
* Add additional summary metrics:  
  * Total lessons  
  * Total earnings  
  * Total deductions


  


12) ## **Analytics**

The Analytics section must be **fully redesigned** to reflect all new system data.

It must include:

* Attendance analytics  
* Payment analytics  
* Recording completion  
* Feedback insights  
* Risk distribution

13) ## **Settings** 

- Add configuration for **Daily Plan penalties**  
- Remove **timezone setting**

14) ## **Other**

Currently there are 3 roles.

A new role must be added:

* **Manager**

# **TEACHER**	

 

1. ## **Dashboard**

It is required to introduce a new **“Notes” feature** in the Dashboard, designed as a lightweight and fast-access note-taking tool, similar to iPhone Notes or quick reminders.

This functionality should allow the user (teacher or student, depending on role access) to create short, temporary notes intended for quick memory support during daily workflow.

Each note must be:

* Easily creatable with minimal interaction (low friction UX)  
* Editable at any time  
* Designed for short-form content (not long documents)

  ### **Behavior Logic**

Each note must include a **checkbox or “Done” action**.

When the user marks a note as “Done”:

* The note should **not be archived or stored**  
* It should be **immediately removed from the interface**

The goal is to maintain a clean and distraction-free workspace by keeping only active notes visible.

### **UI / UX Requirements**

* Notes should visually resemble **sticky notes (stickers)**  
* Preferred style: **yellow sticky note design**  
* Layout should support quick scanning and interaction (grid or free placement)

2. ## **My Students**

Since each group has two teachers:

* **Main Teacher**  
* **Substitute Teacher**

it is required to clearly differentiate students based on their relationship to the teacher.

### **1\. Student differentiation (Main vs Secondary group)**

Within the student list, it must be clearly visible whether a student belongs to:

* The teacher’s **main group**  
* Or a **secondary group**, where the teacher is assigned as a substitute

This can be implemented via:

* Color coding  
* Labels/tags (e.g., *Main Group*, *Secondary Group*)

The purpose is to allow teachers to instantly understand which students are their primary responsibility.

### **2\. Layout optimization**

The current layout uses a left-side structure that limits the usable space.

It is recommended to:

* Move groups to the top of the page  
* Represent them as **tabs**

This will allow the student list to expand horizontally and improve visibility and usability.

### **3\. Student feedback access**

* Teachers must have the ability to view the **complete feedback history** of each student.  
* This should be implemented using an **action icon** (e.g., view or message icon), similar to the admin panel.  
* Clicking this icon should open a detailed view showing all feedback entries for that student.

### **4\. Data simplification (Student profile)**

The teacher panel should not display:

* Passport data  
* Sensitive personal information

Only learning-related data should remain visible to ensure clarity and privacy.

3. **Calendar**

The following changes are required:

* Remove the **“Add Course” button**  
* Disable editing capabilities for teachers

  ### **Interaction Improvements**

In **Week and Month views**, each class card should be clickable.

Clicking a card should open a **detailed modal or view**, similar to how it functions in the list view.

4. ## **Analytics**

 

The Analytics section must be **fully restructured** based on the newly introduced functionalities.

It should provide a comprehensive and accurate overview of:

* Student performance  
* Attendance patterns  
* Feedback trends  
* Optionally, revenue-related data (if accessible)

## 

5. ## **Salary**

A **date filtering system** must be implemented, allowing selection by:

* Day  
* Week  
* Month  
* Custom range

The “Total Lessons” metric must reflect only the selected period, not the entire historical dataset.

Additionally, the data model must clearly define:

* Lessons  
* Deductions  
* Payments

to ensure transparency in calculations.

6. ## **Settings** 

- The **“Teaching” section must be removed** from the Settings panel.

7. ## **Profile** 

- Teachers must have the ability to add a **video link (e.g., YouTube)** to their profile.  
- This video should be visible to their students.




# **Student**	

1. **Chat**

When a new student joins a group, they must be able to see the **entire existing chat history**, not only messages sent after they joined.

2. ## **Other**

1) Student progress should be calculated based on multiple factors, not just attendance:  
* Attendance consistency  
* Recording completion  
* Payment discipline  
  This allows a more accurate and holistic performance evaluation.  
    
2) The Payments section must be redesigned into a **table (column-based) layout**.  
   It must also support:  
* Sorting  
* Clear readability of financial data  
    
3) The student calendar must visually distinguish between different types of days:  
* Scheduled class days → highlighted with a green border  
* Non-class days → displayed in a faded or reduced-opacity state

After classes occur:

* Attended days → one color  
* Absent days → a different color


4) A **Streak system** must be implemented to track consecutive attendance.

   ### **Rules**

* Streak counts only **scheduled class days**  
* If a student misses any scheduled class → streak resets  
* If multiple classes occur in one day:  
  * If all are attended → \+1 day  
  * If at least one is missed → reset

  ### **Data Requirements**

The system must store:

* Current streak count  
* Last attendance date

  ### **Display**

* Example: 🔥 5 Day Streak  
* If no streak: “No active streak”

  ### **Recalculation**

If attendance is modified later, the streak must be recalculated automatically.

### **Visibility**

Visible to:

* Student  
* Teacher  
* Admin
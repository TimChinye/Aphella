# Aphella: A Hospital Management System Prototype

### A Level 4 Software Engineering University Project

## About This Project

Aphella is a full-stack web application developed as a prototype for the "Software Projects" module. The goal was to design and build a system for managing hospital data, focusing on user roles, data visualization, and secure access to information.

This project was a significant learning experience in scoping, planning, and executing a full-stack application from the ground up. While the initial vision included a wide array of features (e.g., billing, full pharmacy management), the final deliverable concentrates on the core functionalities: providing distinct, data-driven dashboard experiences for different user roles within a hospital environment.

## Demo Credentials & Access

To explore the prototype, you may use the following dummy accounts to simulate different user roles.

### 1. Dummy Accounts
*   **Admin:** `stephan.latliff@aphella.com`
*   **Staff:** `lurleen.yearne@aphella.com`
*   **Patient:** `ulitzmann0@unc.edu`

### 2. Password Requirements
For these accounts, the password does not need to match a specific database hash as long as it meets the following complexity validation requirements:
*   At least eight characters
*   One uppercase letter
*   One lowercase letter
*   One number
*   One special character

**Example:** `2Apples!` works successfully.

### 3. Developer Shortcuts (Auto-Login)
For quick testing, you can bypass the login screen by appending the following query parameters to the URL:
*   `?dev=admin`
*   `?dev=staff`
*   `?dev=patient`

## Implemented Features

The prototype successfully implements the following key features:

*   **Role-Based Access Control:** Secure user authentication (using Passport.js) that directs users to one of three distinct dashboards based on their role:
    *   **Admin Dashboard:** Provides a high-level overview of hospital operations, including patient counts, staff numbers, and data visualizations for diagnosis and location statistics.
    *   **Staff Dashboard:** Tailored for medical professionals to view their daily schedule, see a list of their patients, manage requests, and view appointment statistics.
    *   **Patient Dashboard:** A personal portal for patients to view their health metrics, upcoming and past appointments, prescribed medications, and a list of their associated doctors.

*   **Data-Driven Interfaces:** The front-end is built with Vanilla JavaScript (ES6+) and dynamically fetches and displays data from the back-end, populating tables, charts, and information cards.

*   **Data Management Views:**
    *   **Patient & Staff Lists:** Comprehensive views for administrators and staff to see lists of all patients and staff members.
    *   **Sorting & Filtering:** Implemented client-side sorting and filtering on data tables to improve usability.

*   **Appointment Calendar:** A visual calendar interface for users to see their scheduled appointments on a monthly view.

*   **RESTful API Endpoints:** A back-end built with Node.js and Express that serves data from a PostgreSQL database through a series of `/grab/...` endpoints.

## Tech Stack

*   **Backend:** Node.js, Express.js
*   **Database:** PostgreSQL (hosted on Neon.tech)
*   **Authentication:** Passport.js (Local Strategy) for session management.
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
*   **Development Tools:** Nodemon for live server reloading.

## Project Reflection & Key Learnings

This project served as a practical application of software engineering principles. The primary challenge was managing the project's scope within the given timeframe. This led to a crucial learning outcome: the importance of prioritizing a **Minimum Viable Product (MVP)**.

The focus shifted from building *every* conceivable feature to building the *core* features well. This involved:

1.  **Systematic Design:** Transitioning from Entity-Relationship Diagrams (ERDs) and Use-Case Diagrams to a functional database schema and logical API structure.
2.  **Full-Stack Implementation:** Gaining hands-on experience in connecting a front-end interface to a back-end server and a remote database.
3.  **Dynamic UI Development:** Learning to manipulate the DOM and handle asynchronous data fetching (`async/await`) with Vanilla JS to create a responsive and interactive user experience.
4.  **Realistic Planning:** Understanding the trade-offs between feature complexity and development time, a critical skill in professional software development.

Ultimately, Aphella stands as a robust prototype that successfully demonstrates the core concepts of a multi-user, data-centric web application.

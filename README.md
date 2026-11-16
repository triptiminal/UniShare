# UniShare – Campus Rental and Lending Platform

**Share Resources, Save More, Connect Better!**

UniShare is a web-based rental and lending platform designed specifically for university students. It connects students who require items temporarily with students who are willing to lend their belongings for a specified duration.

The platform provides a centralized digital environment where students can list items, discover available resources, submit rental requests, communicate with item owners through an in-app chat facility, and make online rental payments using the Razorpay payment gateway.

UniShare aims to reduce unnecessary purchases, improve the utilization of existing resources, and encourage economical and responsible resource sharing within the university community.

---

## 🎯 Problem Statement

University students frequently require items such as textbooks, calculators, electronic accessories, laboratory equipment, sports equipment, and other everyday essentials. Purchasing these items for short-term use can increase their expenses, especially when they are not required regularly.

At the same time, many students own useful items that remain unused for extended periods. However, the absence of a centralized rental platform makes it difficult to identify available resources, compare rental charges, communicate with item owners, and coordinate rental arrangements.

Students often depend on personal contacts, informal communication channels, or scattered online groups to find and exchange items.

UniShare addresses this problem by providing a dedicated digital platform that simplifies item discovery, rental request management, communication, and online payment within the university community.

---

## 🎯 Objectives

The primary objective of UniShare is to develop a centralized rental and lending platform that connects university students who need items temporarily with students who are willing to lend their belongings.

The specific objectives are:

1. **Centralized Rental Platform:** Provide a common digital environment for student-to-student rental and lending.
2. **User Authentication:** Implement registration and login functionality for controlled access.
3. **Item Listing:** Allow students to list items with descriptions, rental charges, and availability information.
4. **Item Discovery:** Enable users to browse and search for available items.
5. **Rental Request Management:** Support request submission, acceptance, rejection, and status tracking.
6. **In-App Communication:** Enable renters and item owners to communicate regarding rental arrangements.
7. **Online Payments:** Integrate Razorpay for rental payment processing.
8. **Payment Verification:** Verify payment results on the server before updating payment status.
9. **Rental Tracking:** Allow users to monitor their rental requests and related activities.
10. **Resource Utilization:** Encourage students to make better use of their existing belongings.
11. **Economical Sharing:** Reduce unnecessary expenditure on items required only for limited periods.
12. **User Experience:** Provide a convenient and accessible platform for students.

---

## ✨ Key Features

### 1. User Registration and Authentication

- Student registration and login.
- Secure authentication before accessing protected features.
- Controlled access to user-specific information.
- Authorization checks for protected operations.

### 2. Item Listing and Management

- Create item listings for belongings available for rent.
- Add item names, descriptions, rental charges, and availability information.
- Manage and update existing listings.
- Associate every listing with its respective owner.
- Maintain item availability information.

### 3. Item Browsing and Searching

- Browse available item listings.
- Search for items according to user requirements.
- View item descriptions and rental charges.
- Check item availability and relevant owner information.

### 4. Rental Request Management

- Submit rental requests for available items.
- Allow item owners to review incoming requests.
- Accept or reject rental requests.
- Maintain request statuses.
- Display updated request information to relevant users.

### 5. Real-Time In-App Chat

- Enable communication between renters and item owners.
- Support real-time messaging.
- Discuss item availability, rental duration, rental conditions, and charges.
- Coordinate pickup and return arrangements.
- Restrict private conversations to authorized participants.

### 6. Razorpay Payment Integration

- Integrate the Razorpay payment gateway.
- Create payment orders through the application server.
- Provide the Razorpay Checkout payment interface.
- Verify payment information on the server side.
- Maintain transaction records.
- Handle successful, failed, and cancelled payment outcomes.

### 7. Rental Tracking and Completion

- Monitor incoming and outgoing rental requests.
- Track request approval and payment status.
- Maintain rental progress information.
- Coordinate item collection and return.
- Update rental records upon completion.

### 8. User Dashboard

- View published item listings.
- Manage incoming and outgoing rental requests.
- Access rental-related conversations.
- View payment and transaction information.
- Monitor rental progress and completion.

---

## 🏗️ System Architecture

UniShare follows a layered application structure consisting of the following major components:

| Component | Responsibility |
|---|---|
| Presentation Layer | Provides the user interface through which students interact with the platform. |
| Application Layer | Processes user requests, validates input, manages authentication, applies business rules, and handles rental operations. |
| Database Layer | Stores user information, item listings, rental requests, chat messages, and payment records. |
| Communication Component | Supports messaging between renters and item owners. |
| Payment Integration Component | Connects the application with Razorpay for payment processing and verification. |
| File Storage Component | Supports storage of item-related media using Cloudinary. |

### High-Level System Interaction

```text
              Student / Web Browser
                       |
                       v
                UniShare Frontend
                       |
                       v
                UniShare Backend
                  (Spring Boot)
                       |
          +------------+------------+
          |            |            |
          v            v            v
       Database     Cloudinary    Razorpay
          |
          v
    User Information
    Item Listings
    Rental Requests
    Chat Messages
    Payment Records
```

The diagram represents the logical components and their interactions. The exact data flow depends on the implemented modules and integrations.

---

## 🔄 Application Workflow

The primary workflow of UniShare consists of the following steps:

1. **User Registration and Login:** Students create accounts and log in to access the platform.
2. **Item Listing:** A student who wants to lend an item publishes its details, rental charges, and availability.
3. **Item Browsing and Searching:** Renters browse available listings or search for required items.
4. **Viewing Item Details:** Interested students review the selected item's information.
5. **Communication:** Renters communicate with item owners through the in-app chat facility.
6. **Rental Request Submission:** The renter submits a request for the selected item.
7. **Request Approval:** The item owner reviews and accepts or rejects the request.
8. **Online Payment:** An approved request proceeds to the Razorpay payment workflow.
9. **Payment Verification:** The application server verifies payment information before recording a successful transaction.
10. **Rental Tracking:** The system maintains relevant rental and payment statuses.
11. **Rental Completion:** Students coordinate item collection and return, and the rental record is updated.

---

## 🛠️ Technology Stack

The following table distinguishes the technologies used in the current implementation from external services and implementation choices.

| Component | Technology |
|---|---|
| Backend Language | Java |
| Backend Framework | Spring Boot |
| Build Tool | Maven |
| Backend Architecture | RESTful APIs |
| Authentication and Security | Spring Security and JWT |
| Database | SQL and MongoDB |
| File and Image Storage | Cloudinary |
| Communication | Real-Time In-App Chat |
| Payment Gateway | Razorpay |
| Payment Interface | Razorpay Checkout |
| API Testing | Postman |
| Version Control | Git and GitHub |
| Backend IDE | IntelliJ IDEA |
| Frontend | Refer to the frontend implementation |

**Note:** The precise frontend framework, chat transport mechanism, and database-level implementation details should be documented according to the final source code. The SRS leaves some technology selections open.

---

## 📁 Project Structure

The UniShare repository is organized into separate directories for the backend and frontend to maintain a clear separation of responsibilities.

```text
UniShare/
│
├── backend/
│   │
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── campusrent/
│   │   │   │           └── backend/
│   │   │   │
│   │   │   └── resources/
│   │   │
│   │   └── test/
│   │
│   ├── pom.xml
│   ├── .gitignore
│   └── README.md
│
├── frontend/
│   │
│   └── Frontend source code
│
├── .gitignore
│
└── README.md
```

### Directory Description

- **backend/** – Contains the server-side application and backend source code.
- **backend/src/main/java/** – Contains Java source files and application modules.
- **backend/src/main/resources/** – Contains application resources and configuration.
- **backend/src/test/** – Contains backend test source code.
- **backend/pom.xml** – Defines Maven dependencies and build configuration.
- **frontend/** – Contains the client-side interface and frontend source code.
- **.gitignore** – Specifies files and directories that should not be tracked by Git.
- **README.md** – Provides an overview of the complete UniShare project.

---

## ⚙️ Getting Started

Follow these instructions to obtain a local copy of the project and run the backend.

### Prerequisites

Ensure that the following tools are installed:

- Java Development Kit (JDK)
- Maven
- Git
- Configured SQL and MongoDB services required by the application
- Node.js and npm, if required by the frontend implementation

### 1. Clone the Repository

```bash
git clone https://github.com/triptiminal/UniShare.git
```

### 2. Navigate to the Project Directory

```bash
cd UniShare
```

### 3. Run the Backend

Navigate to the backend directory:

```bash
cd backend
```

Build the application:

```bash
mvn clean install
```

Run the Spring Boot application:

```bash
mvn spring-boot:run
```

### 4. Run the Frontend

Navigate to the frontend directory:

```bash
cd ../frontend
```

Install dependencies and start the frontend using the commands specified in its own setup instructions.

**Note:** The frontend run commands depend on the framework and package configuration used in the frontend project.

---

## 🔐 Configuration

Before running UniShare, configure the required application settings.

These may include:

- SQL database connection details.
- MongoDB connection details.
- Cloudinary credentials and configuration.
- Razorpay API credentials.
- JWT and authentication-related configuration.
- Other environment-specific settings.

### Important Security Guidelines

- Never upload database passwords or API secrets to a public repository.
- Do not expose Razorpay secret credentials in frontend code.
- Keep sensitive configuration outside publicly tracked source files.
- Use environment variables or an appropriate secure configuration mechanism.
- Verify payment results on the backend rather than trusting frontend responses.

---

## 🔒 Security and Data Protection

UniShare is designed with security and data protection as important system requirements.

The application should:

- Authenticate users before allowing access to protected features.
- Enforce authorization checks for user-specific operations.
- Restrict private conversations to authorized participants.
- Validate submitted information before processing requests.
- Protect account and rental-related information.
- Keep sensitive payment credentials on the server.
- Verify payment results before updating transaction status.
- Avoid exposing internal exceptions and confidential information.
- Use HTTPS for secure communication in deployment.

---

## 💻 Operating Environment

UniShare is intended to operate as a browser-based application.

### Supported Client Devices

- Desktop computers
- Laptops
- Smartphones
- Tablets

### Operating Systems

- Windows
- Linux
- macOS
- Android
- iOS

A compatible modern web browser and internet connection are required to access the platform's online services.

---

## 📌 Project Scope and Limitations

UniShare focuses on digital coordination of rental and lending activities among university students.

The platform supports:

- Item discovery and listing management.
- Rental request submission and approval.
- Communication between renters and item owners.
- Online rental payments.
- Rental tracking and completion information.

**Physical item delivery is outside the application's scope.** Renters and item owners coordinate collection and return arrangements themselves.

Features such as automated dispute resolution, delivery services, deposits, refunds, and overdue-item management depend on the final project scope.

---

## 🚀 Future Scope

The platform can be extended in future versions through additional functionality, subject to project requirements.

Potential areas for enhancement include:

- Advanced item search and filtering.
- Improved rental availability management.
- Enhanced rental status notifications.
- Additional dashboard and reporting capabilities.
- Expanded rental cancellation and refund management.
- Improved dispute and overdue-item handling.

---


## 🌟 Project Vision

To establish a convenient and organized campus-sharing ecosystem where students can access the resources they need temporarily while making better use of the belongings they already own.

**UniShare – Share Resources, Save More, Connect Better!**
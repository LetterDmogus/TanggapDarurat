# Database Schema

This document describes the database schema for the application. It lists the main tables, columns, constraints and relationships in a structured, easy-to-read format.

## Tables

### agencies
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | INT | PK, AUTO_INCREMENT | Primary key |
| name | VARCHAR | NOT NULL | Agency name |
| type | VARCHAR |  | Agency type/category |
| area | VARCHAR |  | Coverage area |
| contact | VARCHAR |  | Contact info (phone/email) |

### users
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | INT | PK, AUTO_INCREMENT | Primary key |
| name | VARCHAR | NOT NULL | Full name |
| email | VARCHAR | UNIQUE, NOT NULL | Login/email |
| password | VARCHAR | NOT NULL | Hashed password |
| role | ENUM |  | Role (`superadmin`, `admin`, `manager`, `instansi`, `pelapor`) |
| agency_id | INT | NULL, FK -> agencies.id | Optional agency affiliation |
| created_at | DATETIME |  | Timestamp (optional)
| updated_at | DATETIME |  | Timestamp (optional)

### emergency_types
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | INT | PK, AUTO_INCREMENT | Primary key |
| name | VARCHAR | NOT NULL | Internal name |
| display_name | VARCHAR |  | User-facing name |
| description | TEXT |  | Details about this type |
| is_need_location | BOOLEAN |  | Whether a location is required |
| form_schema | JSON |  | Dynamic form definition for this type |

### routing_rules
Logic that maps emergency types to agencies by area/priority.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | INT | PK, AUTO_INCREMENT | Primary key |
| emergency_type_id | INT | FK -> emergency_types.id | Linked emergency type |
| agency_id | INT | FK -> agencies.id | Agency responsible |
| priority | INT |  | Higher priority handled first |
| is_primary | BOOLEAN |  | Whether this rule is primary for the area |
| area | VARCHAR |  | Area/region filter |

### locations
Pre-defined points of interest or saved coordinates.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | INT | PK, AUTO_INCREMENT | Primary key |
| name | VARCHAR |  | Location name |
| location_type | VARCHAR |  | Type (e.g. station, landmark) |
| longitude | DECIMAL(10,7) |  | Longitude (DECIMAL(10,7)) |
| latitude | DECIMAL(10,7) |  | Latitude (DECIMAL(10,7)) |
| agency_id | INT | NULL, FK -> agencies.id | Owning agency (optional)
| metadata | JSON |  | Additional data (e.g. tags)

### reports
Central entity representing an incident submitted by users.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | INT | PK, AUTO_INCREMENT | Primary key |
| emergency_type_id | INT | FK -> emergency_types.id | Type of incident |
| user_id | INT | FK -> users.id | Reporting user |
| location_id | INT | NULL, FK -> locations.id | Optional linked location |
| status | VARCHAR |  | Workflow status |
| description | TEXT |  | Free-text details |
| longitude | DECIMAL(10,7) | NULL | Optional coordinate override |
| latitude | DECIMAL(10,7) | NULL | Optional coordinate override |
| metadata | JSON |  | Additional dynamic data |
| date | DATETIME |  | Incident date/time |

### assignments
Tasks created to assign an agency to a report.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | INT | PK, AUTO_INCREMENT | Primary key |
| report_id | INT | FK -> reports.id | Linked report |
| agency_id | INT | FK -> agencies.id | Assigned agency |
| status | VARCHAR |  | Assignment status |
| description | TEXT |  | Notes about the assignment |
| admin_verification | BOOLEAN |  | Whether an admin verified it |
| date | DATETIME |  | Assignment timestamp |

### report_photos
Media attached to reports.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | INT | PK, AUTO_INCREMENT | Primary key |
| report_id | INT | FK -> reports.id | Parent report |
| file_path | VARCHAR | NOT NULL | Storage path or URL |
| uploaded_by | INT | FK -> users.id | Who uploaded the photo |
| uploaded_at | DATETIME |  | Upload timestamp |

### assignment_photos
Media attached to assignments.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| id | INT | PK, AUTO_INCREMENT | Primary key |
| assignment_id | INT | FK -> assignments.id | Parent assignment |
| file_path | VARCHAR | NOT NULL | Storage path or URL |
| uploaded_by | INT | FK -> users.id | Who uploaded the photo |
| uploaded_at | DATETIME |  | Upload timestamp |

## Relationships
- One agency has many users, locations, routing_rules and assignments (1:N).
- One emergency_type has many reports and routing_rules (1:N).
- One user can submit many reports (1:N).
- One report can have many photos and many assignments (1:N).
- One assignment can have many photos (1:N).
- A report may optionally reference a pre-defined location (location_id nullable) or provide coordinates directly.

## Indexes & Constraints (recommended)
- Add foreign key constraints for all *_id columns referencing their parent tables.
- Index commonly queried columns: `emergency_type_id`, `user_id`, `location_id`, `agency_id`, `status`, and geographic columns if filtering by area.

## Implementation Notes
- Coordinate precision: use `DECIMAL(10,7)` for latitude/longitude (sub-meter precision typical for GPS).
- JSON fields: `form_schema` and `metadata` store dynamic or variable-structured data per emergency type or report.
- Audit trail: `uploaded_by` in photo tables should reference `users.id` to track contributors.
- Nullable `location_id`: allow reports to either link to a `locations` row or carry inline coordinates.
- Migrations: keep migration filenames descriptive and include foreign key setup and indexes.

If you want, I can also:
- generate a machine-readable YAML/JSON version of this schema for docs or tooling,
- or update the project's migration files to match this cleaned schema.

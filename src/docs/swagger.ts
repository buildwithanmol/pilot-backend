export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Pilot Backend API",
    version: "1.0.0",
    description: "API Documentation for Pilot Backend",
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "Development Server",
    },
  ],
  tags: [
    {
      name: "Authentication",
      description: "Employee login and session endpoints (JWT token with sub, role, and 24h exp)",
    },
    {
      name: "Employees",
      description: "Employee management and folder association endpoints",
    },
    {
      name: "Employee Folders",
      description: "Employee Google Drive folders management",
    },
    {
      name: "Channels",
      description: "Channel management endpoints (YouTube & Instagram)",
    },
    {
      name: "Channel Links",
      description: "Channel record links management (Individual & Bulk)",
    },
    {
      name: "Attendance",
      description: "Attendance sync calculation engine and manual overrides",
    },
    {
      name: "Assets",
      description: "Physical device asset management (includes contacts and emails)",
    },
    {
      name: "Asset Contacts",
      description: "Phone contacts associated with assets",
    },
    {
      name: "Asset Emails",
      description: "Email addresses associated with assets",
    },
    {
      name: "Projects",
      description: "Project management endpoints",
    },
    {
      name: "Settings",
      description: "System settings management endpoints",
    },
    {
      name: "Magic Scraping",
      description: "Automated browser scraping for YouTube Shorts and Instagram Reels using Puppeteer",
    },
    {
      name: "System",
      description: "Health and root checks",
    },
  ],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Employee login (issues JWT valid for 24h with sub and role)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "amit.vswkrma@gopulsex.in" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful with token and employee info",
          },
          "401": {
            description: "Invalid email or password",
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current authenticated employee profile from JWT",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Authenticated employee profile details",
          },
          "401": {
            description: "Unauthorized / missing token",
          },
        },
      },
    },
    "/api/v1/magic/{e_id}/yt": {
      get: {
        tags: ["Magic Scraping"],
        summary: "Scrape latest YouTube Shorts for an employee's channels (SSE Stream / JSON)",
        parameters: [
          {
            name: "e_id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Employee UUID",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 4 },
            description: "Number of top shorts to extract per channel (default: 4)",
          },
          {
            name: "stream",
            in: "query",
            schema: { type: "boolean", default: true },
            description: "Stream results in real-time via Server-Sent Events (set false for JSON)",
          },
        ],
        responses: {
          "200": {
            description: "Live SSE stream of scraped channels or JSON report",
          },
          "404": {
            description: "Employee not found",
          },
        },
      },
      post: {
        tags: ["Magic Scraping"],
        summary: "Scrape latest YouTube Shorts for an employee's channels (supports body limit)",
        parameters: [
          {
            name: "e_id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Employee UUID",
          },
          {
            name: "stream",
            in: "query",
            schema: { type: "boolean", default: true },
            description: "Stream results in real-time via Server-Sent Events (set false for JSON)",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  limit: { type: "integer", default: 4, example: 4 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Live SSE stream of scraped channels or JSON report",
          },
          "404": {
            description: "Employee not found",
          },
        },
      },
    },
    "/api/v1/magic/{e_id}/ig": {
      get: {
        tags: ["Magic Scraping"],
        summary: "Scrape latest Instagram Reels for an employee's channels (SSE Stream / JSON)",
        parameters: [
          {
            name: "e_id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Employee UUID",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 4 },
            description: "Number of top reels to extract per channel (default: 4)",
          },
          {
            name: "stream",
            in: "query",
            schema: { type: "boolean", default: true },
            description: "Stream results in real-time via Server-Sent Events (set false for JSON)",
          },
        ],
        responses: {
          "200": {
            description: "Live SSE stream of scraped channels or JSON report",
          },
          "404": {
            description: "Employee not found",
          },
        },
      },
      post: {
        tags: ["Magic Scraping"],
        summary: "Scrape latest Instagram Reels for an employee's channels (supports body limit)",
        parameters: [
          {
            name: "e_id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Employee UUID",
          },
          {
            name: "stream",
            in: "query",
            schema: { type: "boolean", default: true },
            description: "Stream results in real-time via Server-Sent Events (set false for JSON)",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  limit: { type: "integer", default: 4, example: 4 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Live SSE stream of scraped channels or JSON report",
          },
          "404": {
            description: "Employee not found",
          },
        },
      },
    },
    "/": {
      get: {
        tags: ["System"],
        summary: "Root API check",
        responses: {
          "200": {
            description: "API Status",
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Health details",
          },
        },
      },
    },
    "/api/v1/attendance/sync": {
      get: {
        tags: ["Attendance"],
        summary: "Sync and calculate SMM daily attendance based on channel upload thresholds",
        parameters: [
          {
            name: "startDate",
            in: "query",
            schema: { type: "string", format: "date", example: "2026-08-10" },
            description: "Start date of range (YYYY-MM-DD)",
          },
          {
            name: "endDate",
            in: "query",
            schema: { type: "string", format: "date", example: "2026-08-12" },
            description: "End date of range (YYYY-MM-DD)",
          },
          {
            name: "eId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Optional specific SMM employee UUID",
          },
          {
            name: "minThresholdPercentage",
            in: "query",
            schema: { type: "number", default: 80, example: 80 },
            description: "Minimum percentage threshold of target links required for present status (default 80%)",
          },
          {
            name: "saveToDb",
            in: "query",
            schema: { type: "boolean", default: true },
            description: "Whether to persist calculated attendance into database",
          },
        ],
        responses: {
          "200": {
            description: "Attendance sync summary and detailed daily calculations",
          },
        },
      },
      post: {
        tags: ["Attendance"],
        summary: "Trigger attendance sync calculation (supports body payload)",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  startDate: { type: "string", format: "date", example: "2026-08-10" },
                  endDate: { type: "string", format: "date", example: "2026-08-12" },
                  eId: { type: "string", format: "uuid" },
                  minThresholdPercentage: { type: "number", default: 80, example: 80 },
                  saveToDb: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Attendance sync summary and detailed daily calculations",
          },
        },
      },
    },
    "/api/v1/attendance/all": {
      get: {
        tags: ["Attendance"],
        summary: "Get all attendance records (paginated, with employee details)",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
            description: "Limit per page",
          },
          {
            name: "eId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by employee UUID",
          },
          {
            name: "date",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Filter by exact date",
          },
          {
            name: "startDate",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Filter by start date",
          },
          {
            name: "endDate",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Filter by end date",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["present", "absent"] },
            description: "Filter by attendance status",
          },
          {
            name: "edited",
            in: "query",
            schema: { type: "boolean" },
            description: "Filter by manual override status",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,eId,date,status,reason,edited" },
            description: "Comma-separated list of fields",
          },
        ],
        responses: {
          "200": {
            description: "List of attendance records with employee details",
          },
        },
      },
    },
    "/api/v1/attendance/{id}": {
      get: {
        tags: ["Attendance"],
        summary: "Get attendance record by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Attendance UUID",
          },
        ],
        responses: {
          "200": {
            description: "Attendance record details",
          },
          "404": {
            description: "Record not found",
          },
        },
      },
      put: {
        tags: ["Attendance"],
        summary: "Manual override / update an attendance record",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Attendance UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["present", "absent"], example: "present" },
                  reason: { type: "string", example: "Approved leave / manual override by admin" },
                  date: { type: "string", format: "date" },
                  eId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated attendance record",
          },
          "404": {
            description: "Record not found",
          },
        },
      },
      delete: {
        tags: ["Attendance"],
        summary: "Delete an attendance record",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Attendance UUID",
          },
        ],
        responses: {
          "200": {
            description: "Record deleted successfully",
          },
          "404": {
            description: "Record not found",
          },
        },
      },
    },
    "/api/v1/attendance": {
      post: {
        tags: ["Attendance"],
        summary: "Manually create an attendance record",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["eId", "date", "status"],
                properties: {
                  eId: { type: "string", format: "uuid", example: "08b418ac-2ebd-4036-879c-a50b4326361e" },
                  date: { type: "string", format: "date", example: "2026-08-19" },
                  status: { type: "string", enum: ["present", "absent"], example: "present" },
                  reason: { type: "string", example: "Manual attendance entry" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created attendance record",
          },
          "400": {
            description: "Validation error",
          },
        },
      },
    },
    "/api/v1/employees/all": {
      get: {
        tags: ["Employees"],
        summary: "Get all employees (paginated)",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
            description: "Number of records per page",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,firstName,email,role,salary" },
            description: "Comma-separated list of specific fields to select",
          },
          {
            name: "includeDeleted",
            in: "query",
            schema: { type: "boolean", default: false },
            description: "Include soft-deleted employees in results",
          },
        ],
        responses: {
          "200": {
            description: "List of employees with pagination metadata",
          },
        },
      },
    },
    "/api/v1/employees/{id}": {
      get: {
        tags: ["Employees"],
        summary: "Get employee details by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Employee UUID",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,firstName,email,role" },
            description: "Comma-separated list of specific fields to select",
          },
          {
            name: "includeDeleted",
            in: "query",
            schema: { type: "boolean", default: false },
            description: "Include if soft-deleted",
          },
        ],
        responses: {
          "200": {
            description: "Employee details",
          },
          "404": {
            description: "Employee not found",
          },
        },
      },
      put: {
        tags: ["Employees"],
        summary: "Update employee details",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Employee UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string", example: "John" },
                  lastName: { type: "string", example: "Doe" },
                  email: { type: "string", format: "email", example: "john.doe@example.com" },
                  password: { type: "string", example: "newpassword123" },
                  role: { type: "string", enum: ["admin", "smm", "editor"], example: "editor" },
                  salary: { type: "integer", example: 12000 },
                  isDeleted: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated employee details",
          },
          "404": {
            description: "Employee not found",
          },
          "409": {
            description: "Email already in use",
          },
        },
      },
      delete: {
        tags: ["Employees"],
        summary: "Soft delete an employee",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Employee UUID",
          },
        ],
        responses: {
          "200": {
            description: "Employee soft deleted successfully",
          },
          "404": {
            description: "Employee not found",
          },
        },
      },
    },
    "/api/v1/employees": {
      post: {
        tags: ["Employees"],
        summary: "Create a new employee",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "email", "password", "role"],
                properties: {
                  firstName: { type: "string", example: "John" },
                  lastName: { type: "string", example: "Doe" },
                  email: { type: "string", format: "email", example: "john.doe@example.com" },
                  password: { type: "string", example: "securepassword123" },
                  role: { type: "string", enum: ["admin", "smm", "editor"], example: "smm" },
                  salary: { type: "integer", example: 10000 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created employee details",
          },
          "400": {
            description: "Validation error",
          },
          "409": {
            description: "Email already in use",
          },
        },
      },
    },
    "/api/v1/employees/folders": {
      get: {
        tags: ["Employee Folders"],
        summary: "Get all employee folders",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
            description: "Limit per page",
          },
          {
            name: "eId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by employee UUID",
          },
        ],
        responses: {
          "200": {
            description: "List of employee folders",
          },
        },
      },
      post: {
        tags: ["Employee Folders"],
        summary: "Create an employee folder",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["eId"],
                properties: {
                  eId: { type: "string", format: "uuid", example: "08b418ac-2ebd-4036-879c-a50b4326361e" },
                  folderId: { type: "string", example: "1fqas5VieQxqe17ytjWnLQDbh9s7ZymCT" },
                  folderName: { type: "string", example: "Main Drive Folder" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Folder created successfully",
          },
          "400": {
            description: "Validation error (e.g. Editor already has a folder)",
          },
          "404": {
            description: "Employee not found",
          },
        },
      },
    },
    "/api/v1/employees/folders/{id}": {
      get: {
        tags: ["Employee Folders"],
        summary: "Get folder details by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Folder record UUID",
          },
        ],
        responses: {
          "200": {
            description: "Folder details",
          },
          "404": {
            description: "Folder not found",
          },
        },
      },
      put: {
        tags: ["Employee Folders"],
        summary: "Update folder details",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Folder record UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  folderId: { type: "string", example: "1fqas5VieQxqe17ytjWnLQDbh9s7ZymCT_updated" },
                  folderName: { type: "string", example: "Updated Folder Name" },
                  eId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated folder details",
          },
          "400": {
            description: "Validation error",
          },
          "404": {
            description: "Folder not found",
          },
        },
      },
      delete: {
        tags: ["Employee Folders"],
        summary: "Delete a folder record",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Folder record UUID",
          },
        ],
        responses: {
          "200": {
            description: "Folder deleted successfully",
          },
          "404": {
            description: "Folder not found",
          },
        },
      },
    },
    "/api/v1/channels/all": {
      get: {
        tags: ["Channels"],
        summary: "Get all channels (paginated)",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
            description: "Limit per page",
          },
          {
            name: "eId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by employee UUID",
          },
          {
            name: "platform",
            in: "query",
            schema: { type: "string", enum: ["yt", "ig"] },
            description: "Filter by platform",
          },
          {
            name: "includeDeleted",
            in: "query",
            schema: { type: "boolean", default: false },
            description: "Include soft-deleted channels",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,name,platform,url,isDeleted" },
            description: "Comma-separated list of fields",
          },
        ],
        responses: {
          "200": {
            description: "List of channels with pagination metadata",
          },
        },
      },
    },
    "/api/v1/channels/{id}": {
      get: {
        tags: ["Channels"],
        summary: "Get channel details by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Channel UUID",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,name,platform,url" },
            description: "Comma-separated fields",
          },
          {
            name: "includeDeleted",
            in: "query",
            schema: { type: "boolean", default: false },
            description: "Include if soft-deleted",
          },
        ],
        responses: {
          "200": {
            description: "Channel details",
          },
          "404": {
            description: "Channel not found",
          },
        },
      },
      put: {
        tags: ["Channels"],
        summary: "Update channel details",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Channel UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Tech Insights Hub" },
                  platform: { type: "string", enum: ["yt", "ig"], example: "yt" },
                  url: { type: "string", example: "https://youtube.com/@techinsights" },
                  isDeleted: { type: "boolean", example: false },
                  eId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated channel details",
          },
          "404": {
            description: "Channel not found",
          },
        },
      },
      delete: {
        tags: ["Channels"],
        summary: "Soft delete a channel",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Channel UUID",
          },
        ],
        responses: {
          "200": {
            description: "Channel soft deleted successfully",
          },
          "404": {
            description: "Channel not found",
          },
        },
      },
    },
    "/api/v1/channels": {
      post: {
        tags: ["Channels"],
        summary: "Create a new channel",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["eId", "url"],
                properties: {
                  eId: { type: "string", format: "uuid", example: "08b418ac-2ebd-4036-879c-a50b4326361e" },
                  name: { type: "string", example: "Tech Insights Hub" },
                  platform: { type: "string", enum: ["yt", "ig"], example: "yt" },
                  url: { type: "string", example: "https://youtube.com/@techinsights" },
                  isDeleted: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created channel details",
          },
          "400": {
            description: "Validation error",
          },
          "404": {
            description: "Employee not found",
          },
        },
      },
    },
    "/api/v1/channels/links/all": {
      get: {
        tags: ["Channel Links"],
        summary: "Get all channel record links (paginated)",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
            description: "Limit per page",
          },
          {
            name: "cId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by channel UUID",
          },
          {
            name: "eId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by employee UUID",
          },
          {
            name: "pId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by project UUID",
          },
          {
            name: "date",
            in: "query",
            schema: { type: "string", format: "date", example: "2026-08-19" },
            description: "Filter by date (YYYY-MM-DD)",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,cId,pId,link,date" },
            description: "Comma-separated list of fields",
          },
        ],
        responses: {
          "200": {
            description: "List of channel links with pagination metadata",
          },
        },
      },
    },
    "/api/v1/channels/links/{id}": {
      get: {
        tags: ["Channel Links"],
        summary: "Get single channel record link by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Link record UUID",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,link,date" },
            description: "Comma-separated list of fields",
          },
        ],
        responses: {
          "200": {
            description: "Link details",
          },
          "404": {
            description: "Link not found",
          },
        },
      },
      put: {
        tags: ["Channel Links"],
        summary: "Update a single channel record link by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Link record UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  link: { type: "string", example: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
                  date: { type: "string", format: "date", example: "2026-08-19" },
                  cId: { type: "string", format: "uuid" },
                  eId: { type: "string", format: "uuid" },
                  pId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated link record details",
          },
          "404": {
            description: "Link record not found",
          },
          "409": {
            description: "Link already exists",
          },
        },
      },
      delete: {
        tags: ["Channel Links"],
        summary: "Delete a single channel record link by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Link record UUID",
          },
        ],
        responses: {
          "200": {
            description: "Link deleted successfully",
          },
          "404": {
            description: "Link not found",
          },
        },
      },
    },
    "/api/v1/channels/links": {
      post: {
        tags: ["Channel Links"],
        summary: "Create channel record link(s) (SMM scoped to own eId, Admin unscoped)",
        description: "Requires JWT Bearer authentication. SMM employees can only create links matching their own employee ID. Admins can create links for any employee.",
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    required: ["eId", "cId", "pId", "link"],
                    properties: {
                      eId: { type: "string", format: "uuid", example: "08b418ac-2ebd-4036-879c-a50b4326361e" },
                      cId: { type: "string", format: "uuid", example: "2fe42134-4180-4205-ac30-7b3a84890aac" },
                      pId: { type: "string", format: "uuid", example: "dabdbdb7-f5fc-411d-a4d7-d1a5c5746509" },
                      date: { type: "string", format: "date", example: "2026-08-19" },
                      link: { type: "string", example: "https://youtube.com/watch?v=sample1" },
                    },
                  },
                  {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["eId", "cId", "pId", "link"],
                      properties: {
                        eId: { type: "string", format: "uuid" },
                        cId: { type: "string", format: "uuid" },
                        pId: { type: "string", format: "uuid" },
                        date: { type: "string", format: "date" },
                        link: { type: "string" },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created link record(s)",
          },
          "400": {
            description: "Validation error",
          },
          "409": {
            description: "Link already exists",
          },
        },
      },
      put: {
        tags: ["Channel Links"],
        summary: "Update links in bulk or single payload with ID",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    required: ["id"],
                    properties: {
                      id: { type: "string", format: "uuid" },
                      link: { type: "string", example: "https://youtube.com/watch?v=updated" },
                      date: { type: "string", format: "date" },
                      cId: { type: "string", format: "uuid" },
                      eId: { type: "string", format: "uuid" },
                      pId: { type: "string", format: "uuid" },
                    },
                  },
                  {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["id"],
                      properties: {
                        id: { type: "string", format: "uuid" },
                        link: { type: "string" },
                        date: { type: "string", format: "date" },
                        cId: { type: "string", format: "uuid" },
                        eId: { type: "string", format: "uuid" },
                        pId: { type: "string", format: "uuid" },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated links list or object",
          },
          "400": {
            description: "Validation error",
          },
          "409": {
            description: "Link already exists",
          },
        },
      },
      delete: {
        tags: ["Channel Links"],
        summary: "Delete multiple links by list of IDs in body",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ids"],
                properties: {
                  ids: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Deleted links confirmation",
          },
          "400": {
            description: "IDs missing",
          },
        },
      },
    },
    "/api/v1/assets/all": {
      get: {
        tags: ["Assets"],
        summary: "Get all assets with contacts and emails populated (paginated)",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
            description: "Limit per page",
          },
          {
            name: "eId",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by employee UUID",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,eId,model,imei1,imei2" },
            description: "Comma-separated list of fields",
          },
        ],
        responses: {
          "200": {
            description: "List of assets with populated contacts and emails",
          },
        },
      },
    },
    "/api/v1/assets/{id}": {
      get: {
        tags: ["Assets"],
        summary: "Get asset details by ID (including contacts and emails)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Asset UUID",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,model,imei1" },
            description: "Comma-separated list of fields",
          },
        ],
        responses: {
          "200": {
            description: "Asset details with contacts and emails",
          },
          "404": {
            description: "Asset not found",
          },
        },
      },
      put: {
        tags: ["Assets"],
        summary: "Update asset details",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Asset UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  model: { type: "string", example: "OnePlus Nord CE 3" },
                  imei1: { type: "string", example: "867543029182736" },
                  imei2: { type: "string", example: "867543029182737" },
                  eId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated asset details",
          },
          "404": {
            description: "Asset not found",
          },
        },
      },
      delete: {
        tags: ["Assets"],
        summary: "Delete an asset",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Asset UUID",
          },
        ],
        responses: {
          "200": {
            description: "Asset deleted successfully",
          },
          "404": {
            description: "Asset not found",
          },
        },
      },
    },
    "/api/v1/assets": {
      post: {
        tags: ["Assets"],
        summary: "Create an asset (optionally with initial contacts & emails)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["eId", "model"],
                properties: {
                  eId: { type: "string", format: "uuid", example: "08b418ac-2ebd-4036-879c-a50b4326361e" },
                  model: { type: "string", example: "OnePlus Nord CE 3" },
                  imei1: { type: "string", example: "867543029182736" },
                  imei2: { type: "string", example: "867543029182737" },
                  contacts: {
                    type: "array",
                    items: { type: "string" },
                    example: ["+91 9876543210"],
                  },
                  emails: {
                    type: "array",
                    items: { type: "string" },
                    example: ["device1@company.com"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created asset details",
          },
          "400": {
            description: "Validation error",
          },
          "404": {
            description: "Employee not found",
          },
        },
      },
    },
    "/api/v1/assets/contacts": {
      post: {
        tags: ["Asset Contacts"],
        summary: "Create asset contact(s) (Individual or Bulk)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    required: ["aId", "contact"],
                    properties: {
                      aId: { type: "string", format: "uuid" },
                      contact: { type: "string", example: "+91 9876543210" },
                    },
                  },
                  {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["aId", "contact"],
                      properties: {
                        aId: { type: "string", format: "uuid" },
                        contact: { type: "string", example: "+91 9876543210" },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created contact record(s)",
          },
          "400": {
            description: "Validation error",
          },
        },
      },
    },
    "/api/v1/assets/contacts/{id}": {
      put: {
        tags: ["Asset Contacts"],
        summary: "Update an asset contact by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Contact record UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  contact: { type: "string", example: "+91 9123456780" },
                  aId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated contact record",
          },
          "404": {
            description: "Contact record not found",
          },
        },
      },
      delete: {
        tags: ["Asset Contacts"],
        summary: "Delete an asset contact by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Contact record UUID",
          },
        ],
        responses: {
          "200": {
            description: "Contact deleted successfully",
          },
          "404": {
            description: "Contact not found",
          },
        },
      },
    },
    "/api/v1/assets/emails": {
      post: {
        tags: ["Asset Emails"],
        summary: "Create asset email(s) (Individual or Bulk)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    required: ["aId", "email"],
                    properties: {
                      aId: { type: "string", format: "uuid" },
                      email: { type: "string", format: "email", example: "device.email@example.com" },
                    },
                  },
                  {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["aId", "email"],
                      properties: {
                        aId: { type: "string", format: "uuid" },
                        email: { type: "string", format: "email" },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created email record(s)",
          },
          "400": {
            description: "Validation error",
          },
        },
      },
    },
    "/api/v1/assets/emails/{id}": {
      put: {
        tags: ["Asset Emails"],
        summary: "Update an asset email by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Email record UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email", example: "new.device@example.com" },
                  aId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated email record",
          },
          "404": {
            description: "Email record not found",
          },
        },
      },
      delete: {
        tags: ["Asset Emails"],
        summary: "Delete an asset email by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Email record UUID",
          },
        ],
        responses: {
          "200": {
            description: "Email deleted successfully",
          },
          "404": {
            description: "Email not found",
          },
        },
      },
    },
    "/api/v1/projects/all": {
      get: {
        tags: ["Projects"],
        summary: "Get all projects (paginated)",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
            description: "Limit per page",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,name,status" },
            description: "Comma-separated list of specific fields",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "boolean" },
            description: "Filter by active (true) or inactive (false)",
          },
        ],
        responses: {
          "200": {
            description: "List of projects with pagination metadata",
          },
        },
      },
    },
    "/api/v1/projects/{id}": {
      get: {
        tags: ["Projects"],
        summary: "Get project details by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Project UUID",
          },
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,name,description,status" },
            description: "Comma-separated list of fields",
          },
        ],
        responses: {
          "200": {
            description: "Project details",
          },
          "404": {
            description: "Project not found",
          },
        },
      },
      put: {
        tags: ["Projects"],
        summary: "Update project details",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Project UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Project Alpha" },
                  description: { type: "string", example: "Alpha campaign project" },
                  status: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated project details",
          },
          "404": {
            description: "Project not found",
          },
        },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete a project",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Project UUID",
          },
        ],
        responses: {
          "200": {
            description: "Project deleted successfully",
          },
          "404": {
            description: "Project not found",
          },
        },
      },
    },
    "/api/v1/projects": {
      post: {
        tags: ["Projects"],
        summary: "Create a new project",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Pilot Project" },
                  description: { type: "string", example: "Main operations project" },
                  status: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created project details",
          },
          "400": {
            description: "Validation error",
          },
        },
      },
    },
    "/api/v1/settings": {
      get: {
        tags: ["Settings"],
        summary: "Get active system settings",
        parameters: [
          {
            name: "fields",
            in: "query",
            schema: { type: "string", example: "id,editorDailyUploadLimit,smmChannelLimit" },
            description: "Comma-separated list of fields",
          },
        ],
        responses: {
          "200": {
            description: "Active system settings details",
          },
        },
      },
      put: {
        tags: ["Settings"],
        summary: "Update active system settings",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  editorDailyUploadLimit: { type: "integer", example: 15 },
                  smmChannelLimit: { type: "integer", example: 25 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated active system settings",
          },
        },
      },
      post: {
        tags: ["Settings"],
        summary: "Create a new settings record",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  editorDailyUploadLimit: { type: "integer", example: 10 },
                  smmChannelLimit: { type: "integer", example: 20 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Settings record created",
          },
        },
      },
    },
    "/api/v1/settings/all": {
      get: {
        tags: ["Settings"],
        summary: "Get all settings records (paginated)",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
            description: "Limit per page",
          },
        ],
        responses: {
          "200": {
            description: "List of settings records",
          },
        },
      },
    },
    "/api/v1/settings/{id}": {
      get: {
        tags: ["Settings"],
        summary: "Get settings by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Settings UUID",
          },
        ],
        responses: {
          "200": {
            description: "Settings details",
          },
          "404": {
            description: "Settings record not found",
          },
        },
      },
      put: {
        tags: ["Settings"],
        summary: "Update specific settings by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Settings UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  editorDailyUploadLimit: { type: "integer", example: 12 },
                  smmChannelLimit: { type: "integer", example: 22 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated settings record",
          },
          "404": {
            description: "Settings record not found",
          },
        },
      },
      delete: {
        tags: ["Settings"],
        summary: "Delete settings record",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Settings UUID",
          },
        ],
        responses: {
          "200": {
            description: "Settings record deleted successfully",
          },
          "404": {
            description: "Settings record not found",
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT Bearer token in the format: Bearer <token>",
      },
    },
  },
};

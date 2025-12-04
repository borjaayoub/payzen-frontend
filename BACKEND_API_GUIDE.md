# Backend API Guide for Employee Management

This document describes the .NET Web API endpoints that need to be implemented to support the employee management frontend.

## Base URL

```
http://localhost:5000/api
```

Update this in the service file: `src/app/features/employees/services/employee.service.ts` (line 34)

---

## Endpoints

### 1. Get All Employees (with Filters)

**Endpoint:** `GET /api/employees`

**Query Parameters:**
- `search` (optional) - Search by first name, last name, or position
- `department` (optional) - Filter by department
- `status` (optional) - Filter by status (`active`, `on_leave`, `inactive`)
- `page` (optional) - Page number for pagination
- `pageSize` (optional) - Number of items per page

**Response:**
```json
{
  "employees": [
    {
      "id": "string",
      "photo": "string (optional)",
      "firstName": "string",
      "lastName": "string",
      "position": "string",
      "department": "string",
      "status": "active|on_leave|inactive",
      "startDate": "string (ISO date)",
      "missingDocuments": 0,
      "contractType": "CDI|CDD|Stage",
      "manager": "string (optional)"
    }
  ],
  "total": 100
}
```

**C# Controller Example:**
```csharp
[HttpGet]
public async Task<ActionResult<EmployeeListResponse>> GetEmployees(
    [FromQuery] string? search,
    [FromQuery] string? department,
    [FromQuery] string? status,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 50)
{
    var query = _context.Employees.AsQueryable();

    if (!string.IsNullOrEmpty(search))
    {
        query = query.Where(e =>
            e.FirstName.Contains(search) ||
            e.LastName.Contains(search) ||
            e.Position.Contains(search));
    }

    if (!string.IsNullOrEmpty(department))
    {
        query = query.Where(e => e.Department == department);
    }

    if (!string.IsNullOrEmpty(status))
    {
        query = query.Where(e => e.Status == status);
    }

    var total = await query.CountAsync();
    var employees = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Ok(new { employees, total });
}
```

---

### 2. Get Employee by ID

**Endpoint:** `GET /api/employees/{id}`

**Response:**
```json
{
  "id": "1",
  "photo": "https://example.com/photo.jpg",
  "firstName": "Youssef",
  "lastName": "Amrani",
  "position": "Développeur Senior",
  "department": "IT",
  "status": "active",
  "startDate": "2022-01-15",
  "missingDocuments": 0,
  "contractType": "CDI",
  "manager": "Ahmed Bennani"
}
```

**C# Controller Example:**
```csharp
[HttpGet("{id}")]
public async Task<ActionResult<Employee>> GetEmployee(string id)
{
    var employee = await _context.Employees.FindAsync(id);

    if (employee == null)
    {
        return NotFound(new { message = "Employee not found" });
    }

    return Ok(employee);
}
```

---

### 3. Create Employee

**Endpoint:** `POST /api/employees`

**Request Body:**
```json
{
  "photo": "string (optional)",
  "firstName": "string",
  "lastName": "string",
  "position": "string",
  "department": "string",
  "status": "active",
  "startDate": "2024-01-15",
  "missingDocuments": 0,
  "contractType": "CDI",
  "manager": "string (optional)"
}
```

**Response:** Same as Get Employee by ID response

**C# Controller Example:**
```csharp
[HttpPost]
public async Task<ActionResult<Employee>> CreateEmployee(CreateEmployeeDto dto)
{
    var employee = new Employee
    {
        Id = Guid.NewGuid().ToString(),
        FirstName = dto.FirstName,
        LastName = dto.LastName,
        Position = dto.Position,
        Department = dto.Department,
        Status = dto.Status,
        StartDate = dto.StartDate,
        MissingDocuments = dto.MissingDocuments,
        ContractType = dto.ContractType,
        Manager = dto.Manager,
        Photo = dto.Photo
    };

    _context.Employees.Add(employee);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, employee);
}
```

---

### 4. Update Employee

**Endpoint:** `PUT /api/employees/{id}`

**Request Body:** Same as Create Employee (partial updates allowed)

**Response:** Updated employee object

**C# Controller Example:**
```csharp
[HttpPut("{id}")]
public async Task<ActionResult<Employee>> UpdateEmployee(string id, UpdateEmployeeDto dto)
{
    var employee = await _context.Employees.FindAsync(id);

    if (employee == null)
    {
        return NotFound(new { message = "Employee not found" });
    }

    // Update properties
    if (!string.IsNullOrEmpty(dto.FirstName))
        employee.FirstName = dto.FirstName;
    if (!string.IsNullOrEmpty(dto.LastName))
        employee.LastName = dto.LastName;
    // ... update other properties

    await _context.SaveChangesAsync();

    return Ok(employee);
}
```

---

### 5. Delete Employee

**Endpoint:** `DELETE /api/employees/{id}`

**Response:**
```json
{
  "message": "Employee deleted successfully"
}
```

**C# Controller Example:**
```csharp
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteEmployee(string id)
{
    var employee = await _context.Employees.FindAsync(id);

    if (employee == null)
    {
        return NotFound(new { message = "Employee not found" });
    }

    _context.Employees.Remove(employee);
    await _context.SaveChangesAsync();

    return Ok(new { message = "Employee deleted successfully" });
}
```

---

### 6. Get Departments List

**Endpoint:** `GET /api/employees/departments`

**Response:**
```json
["IT", "RH", "Finance", "Marketing", "Operations"]
```

**C# Controller Example:**
```csharp
[HttpGet("departments")]
public async Task<ActionResult<List<string>>> GetDepartments()
{
    var departments = await _context.Employees
        .Select(e => e.Department)
        .Distinct()
        .OrderBy(d => d)
        .ToListAsync();

    return Ok(departments);
}
```

---

## SQL Server Database Schema

```sql
CREATE TABLE Employees (
    Id NVARCHAR(50) PRIMARY KEY,
    Photo NVARCHAR(500) NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Position NVARCHAR(200) NOT NULL,
    Department NVARCHAR(100) NOT NULL,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('active', 'on_leave', 'inactive')),
    StartDate DATE NOT NULL,
    MissingDocuments INT NOT NULL DEFAULT 0,
    ContractType NVARCHAR(20) NOT NULL CHECK (ContractType IN ('CDI', 'CDD', 'Stage')),
    Manager NVARCHAR(200) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Index for faster queries
CREATE INDEX IX_Employees_Department ON Employees(Department);
CREATE INDEX IX_Employees_Status ON Employees(Status);
CREATE INDEX IX_Employees_Name ON Employees(FirstName, LastName);
```

---

## C# Models

```csharp
// Employee.cs
public class Employee
{
    public string Id { get; set; }
    public string? Photo { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Position { get; set; }
    public string Department { get; set; }
    public string Status { get; set; } // active, on_leave, inactive
    public DateTime StartDate { get; set; }
    public int MissingDocuments { get; set; }
    public string ContractType { get; set; } // CDI, CDD, Stage
    public string? Manager { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// EmployeeListResponse.cs
public class EmployeeListResponse
{
    public List<Employee> Employees { get; set; }
    public int Total { get; set; }
}

// CreateEmployeeDto.cs
public class CreateEmployeeDto
{
    public string? Photo { get; set; }

    [Required]
    public string FirstName { get; set; }

    [Required]
    public string LastName { get; set; }

    [Required]
    public string Position { get; set; }

    [Required]
    public string Department { get; set; }

    [Required]
    public string Status { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public int MissingDocuments { get; set; }

    [Required]
    public string ContractType { get; set; }

    public string? Manager { get; set; }
}

// UpdateEmployeeDto.cs (all optional for partial updates)
public class UpdateEmployeeDto
{
    public string? Photo { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public string? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public int? MissingDocuments { get; set; }
    public string? ContractType { get; set; }
    public string? Manager { get; set; }
}
```

---

## CORS Configuration

Make sure to enable CORS in your .NET API to allow requests from the Angular frontend:

```csharp
// Program.cs or Startup.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        builder => builder
            .WithOrigins("http://localhost:4200") // Angular dev server
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Before app.MapControllers()
app.UseCors("AllowAngularApp");
```

---

## Testing the API

You can test the endpoints using:
- **Swagger/OpenAPI**: Available at `http://localhost:5000/swagger`
- **Postman**: Import the endpoints
- **curl** commands

Example curl command:
```bash
curl -X GET "http://localhost:5000/api/employees?search=Youssef&department=IT" \
  -H "Content-Type: application/json"
```

---

## Next Steps

1. Create the SQL Server database and run the schema
2. Implement the .NET Web API controller with the endpoints above
3. Configure CORS to allow Angular frontend requests
4. Update the API URL in `employee.service.ts` if different from `http://localhost:5000`
5. Test each endpoint using Swagger or Postman
6. Run both the .NET backend and Angular frontend together

The Angular frontend is now ready to consume your .NET API!

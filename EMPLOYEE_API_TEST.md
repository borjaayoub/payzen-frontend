# Employee API Integration - Testing Guide

The employee API integration has been successfully set up! Here's what was done and how to test it.

## What Was Implemented

### 1. Employee Service (`src/app/features/employees/services/employee.service.ts`)
Created a complete service with all CRUD operations:
- ✅ `getEmployees(filters)` - Get all employees with optional filters
- ✅ `getEmployeeById(id)` - Get single employee
- ✅ `createEmployee(data)` - Create new employee
- ✅ `updateEmployee(id, data)` - Update employee
- ✅ `deleteEmployee(id)` - Delete employee
- ✅ `getDepartments()` - Get departments list

### 2. Environment Configuration
- ✅ Created `src/environments/environment.ts` with API URL
- ✅ Created `src/environments/environment.prod.ts` for production
- ✅ Service now uses `environment.apiUrl` instead of hardcoded URL

### 3. HttpClient Configuration
- ✅ HttpClient is already provided in `app.config.ts`
- ✅ No additional configuration needed

### 4. Component Integration
The `EmployeesPage` component (`src/app/features/employees/employees.ts`) is already configured to:
- ✅ Load employees on initialization
- ✅ Display loading state
- ✅ Show error messages
- ✅ Display employee stats
- ✅ Filter employees by search, department, and status

## API Endpoint Expected

The frontend expects your .NET backend to be running at:
```
http://localhost:5000/api/employees
```

### Required Response Format

**GET /api/employees**
```json
{
  "employees": [
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
  ],
  "total": 1
}
```

## How to Test

### Step 1: Start Your .NET Backend
```bash
# Make sure your .NET API is running on http://localhost:5000
cd path/to/your/backend
dotnet run
```

### Step 2: Start Angular Frontend
```bash
cd payzen-frontend
ng serve
```

### Step 3: Navigate to Employees Page
Open your browser and go to:
```
http://localhost:4200/employees
```

### Expected Behavior

#### ✅ If Backend is Running:
- Loading spinner appears briefly
- Employee data loads from your API
- Stats cards show correct counts
- Table displays employee list
- Filters work (search, department, status)

#### ⚠️ If Backend is NOT Running:
- Error message appears: "Failed to load employees"
- Console shows CORS or connection error
- Retry button allows re-attempting the request

## Testing Scenarios

### 1. Test Basic Data Loading
```typescript
// The component automatically calls this on init:
this.employeeService.getEmployees().subscribe({
  next: (response) => console.log('Employees loaded:', response),
  error: (err) => console.error('Error:', err)
});
```

### 2. Test with Filters
Navigate to `/employees` and try:
- Type in search box → Should filter employees
- Select department → Should filter by department
- Select status → Should filter by status

### 3. Test Error Handling
1. Stop your backend
2. Refresh the page
3. You should see error message
4. Click "Retry" button
5. Start backend
6. Click "Retry" again → Data should load

## Backend API Checklist

Ensure your .NET backend has:
- ☐ `GET /api/employees` endpoint implemented
- ☐ CORS enabled for `http://localhost:4200`
- ☐ Returns correct JSON format (see above)
- ☐ Handles query parameters: `search`, `department`, `status`

### CORS Configuration (Required!)
Add this to your .NET `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        builder => builder
            .WithOrigins("http://localhost:4200")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Before app.MapControllers()
app.UseCors("AllowAngularApp");
```

## Troubleshooting

### Issue: CORS Error
**Error in Console:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/employees' from origin
'http://localhost:4200' has been blocked by CORS policy
```

**Solution:** Add CORS configuration to your .NET backend (see above)

### Issue: Connection Refused
**Error in Console:**
```
HttpErrorResponse {status: 0, statusText: "Unknown Error"}
```

**Solution:**
- Make sure backend is running
- Check backend URL is `http://localhost:5000`
- Verify endpoint path is `/api/employees`

### Issue: Wrong Data Format
**Error in Console:**
```
Property 'employees' does not exist on type 'Object'
```

**Solution:**
- Check your backend returns `{ employees: [...], total: number }`
- Not just an array `[...]`

## API URL Configuration

To change the API URL, edit:
- **Development:** `src/environments/environment.ts`
- **Production:** `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'  // Change this
};
```

## Next Steps

1. ✅ Service created and configured
2. ✅ Component integrated
3. ⏳ **Your Turn:** Implement .NET backend endpoints
4. ⏳ Test the integration
5. ⏳ Add more features (create, update, delete)

## Quick Backend Test

Before connecting to Angular, test your backend directly:

```bash
# Test GET employees
curl http://localhost:5000/api/employees

# Expected response:
# {"employees":[...],"total":10}
```

---

**Status:** ✅ Frontend is ready and waiting for your backend!

The employees page will automatically load data once your .NET API is running and returns the correct format.

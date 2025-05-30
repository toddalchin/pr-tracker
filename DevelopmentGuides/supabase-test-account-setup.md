# Supabase Test Account Setup Guide

This guide provides a straightforward approach for setting up test accounts in Supabase for development purposes. This approach will help you avoid email verification issues during testing.

## Quick Reference

### Test Account Credentials
```
Email: test.user.dev@gmail.com
Password: testpassword123
```

## Creating a Test Account in Supabase

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com) and log in to your account
2. Open your project

### Step 2: Create the Test User
1. Navigate to **Authentication → Users**
2. Click **Add User**
3. Enter the test account details:
   - Email: `test.user.dev@gmail.com`
   - Password: `testpassword123`
4. **Important:** Check the **"Auto-confirm users"** checkbox
5. Click **Create User**

![Supabase Add User](https://i.imgur.com/example-image.png)

## Implementation in React Projects

### Simple Test Account Login Function

Add this utility function to your project (e.g., in `src/lib/devUtils.ts`):

```typescript
import { supabase } from './supabase'; // Adjust import path as needed

// Test account credentials
const TEST_EMAIL = 'test.user.dev@gmail.com';
const TEST_PASSWORD = 'testpassword123';

/**
 * Try to sign in with a test account
 * If login fails, return instructions for setting up a test account
 */
export async function useTestAccount() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('useTestAccount should not be called in production');
    return null;
  }

  console.log('Attempting to sign in with test account...');
  
  // Try to sign in with the test account
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  
  if (data?.user) {
    console.log('Test account login successful');
    return { success: true, user: data.user };
  }
  
  console.log('Test login failed:', error?.message);
  return { 
    success: false, 
    credentials: { email: TEST_EMAIL, password: TEST_PASSWORD }
  };
}
```

### Login Component Integration

Here's how to integrate the test account login in your login component:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestAccount } from '@/lib/devUtils'; // Adjust import path as needed

// Inside your Login component
const handleTestLogin = async () => {
  setIsLoading(true);
  
  try {
    const result = await useTestAccount();
    
    if (result?.success) {
      // Successful login - redirect to app
      toast.success('Test account login successful!');
      navigate('/dashboard'); // Adjust route as needed
    } else if (result?.credentials) {
      // Pre-fill the form with test credentials
      setEmail(result.credentials.email);
      setPassword(result.credentials.password);
      toast.success('Test credentials filled in! Click Sign In to continue.');
    } else {
      toast.error('Could not use test account.');
    }
  } catch (error) {
    console.error('Error using test account:', error);
    toast.error('Failed to use test account');
  } finally {
    setIsLoading(false);
  }
};
```

### Sample Login Page UI

Add this test account section to your login form (development only):

```jsx
{/* Simple development test login option */}
{process.env.NODE_ENV !== 'production' && (
  <div className="p-4 mt-4 border-t">
    <div className="p-3 bg-amber-50 rounded-md mb-3 text-sm">
      <p className="font-medium text-amber-800">Development Testing</p>
      <p className="text-xs text-amber-700 mt-1">
        To use a test account in Supabase, you need to:
      </p>
      <ol className="list-decimal text-xs text-amber-700 pl-4 mt-1 space-y-1">
        <li>Go to your Supabase project dashboard</li>
        <li>Go to Authentication → Users → Add User</li>
        <li>Create a user with email: test.user.dev@gmail.com</li>
        <li>Password: testpassword123</li>
        <li><strong>Important:</strong> Check the "Auto-confirm users" checkbox</li>
        <li>Click "Create User"</li>
        <li>Come back and click "Use Test Account" below</li>
      </ol>
    </div>
    
    <button 
      type="button"
      onClick={handleTestLogin}
      className="w-full bg-blue-600 text-white p-2 rounded"
      disabled={isLoading}
    >
      {isLoading ? 'Accessing test account...' : 'Use Test Account'}
    </button>
    
    <p className="text-xs text-gray-500 mt-2 text-center">
      This option is for development testing only
    </p>
  </div>
)}
```

## Test Data Generation

If you need sample data for your test user, you can add a utility function like this:

```typescript
/**
 * Creates sample data for testing
 */
export async function createSampleData(userId: string) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('createSampleData should not be called in production');
    return false;
  }

  try {
    // Example: Creating sample items for a test user
    const sampleItems = [
      {
        user_id: userId,
        name: 'Sample Item 1',
        description: 'This is a sample item',
        // Add other fields relevant to your app
      },
      {
        user_id: userId,
        name: 'Sample Item 2',
        description: 'This is another sample item',
        // Add other fields relevant to your app
      }
    ];

    const { error } = await supabase
      .from('your_table_name') // Replace with your actual table name
      .insert(sampleItems);

    if (error) {
      console.error('Error creating sample data:', error);
      return false;
    }

    console.log('Sample data created successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error in createSampleData:', error);
    return false;
  }
}
```

## Best Practices

1. **Never use test account code in production**
   - Always wrap test account functionality with `process.env.NODE_ENV !== 'production'` checks
   - Make test-related functions return early if called in production

2. **Use consistent test account credentials** across projects
   - Using the same credentials (`test.user.dev@gmail.com` / `testpassword123`) makes it easier to remember

3. **Create the test account manually**
   - Rather than trying to automate account creation, which requires email verification
   - Manual creation with "Auto-confirm users" checked is more reliable

4. **Keep test account UI clearly marked**
   - Use distinctive styling for the test account section
   - Clearly label as "Development Testing Only"

5. **Add test data generation utilities**
   - Include functions to create sample data for testing
   - Make these functions idempotent (can be run multiple times safely)

## Why This Approach Works

Supabase requires email verification by default, which complicates automated test account creation. By creating a verified test account manually through the Supabase dashboard, we work with Supabase's security model rather than against it.

This approach provides a clean, maintainable solution that:
- Avoids email verification complexity
- Works reliably across different projects
- Keeps a clear separation between development and production code

## Troubleshooting

If you encounter issues with the test account:

1. **Check account exists** - Verify the account exists in Supabase dashboard
2. **Verify email confirmation** - Ensure "Email Confirmed" is set to true
3. **Check password** - Reset password if needed
4. **Look for RLS issues** - Row Level Security might prevent data access
5. **Check console for errors** - Supabase API errors are logged to console 
# Supabase Integration Guide for Frontend Applications

This document provides a structured approach to integrating Supabase with a frontend application (React/Next.js/Vue/etc.) based on lessons learned from our "Recurring Nightmare" project.

## Project Setup Stages

### 1. Initial Setup

- [ ] Create a new project using your frontend framework of choice
- [ ] Set up version control (Git)
- [ ] Configure linting and code formatting
- [ ] Set up environment variables with `.env` and `.env.example` files

### 2. Supabase Project Creation

- [ ] Create a new Supabase project from the dashboard
- [ ] Save API credentials in a secure location
- [ ] Add credentials to your `.env` file:
  ```
  VITE_SUPABASE_URL=your-supabase-url-here
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
  ```

### 3. Database Schema Design

- [ ] Design your database schema with proper relationships
- [ ] Create SQL scripts for table creation including:
  - Primary keys (using UUIDs is recommended)
  - Foreign key relationships
  - Default values
  - Not null constraints where appropriate
  - Timestamps for created_at/updated_at

### 4. Set Up RLS (Row Level Security)

- [ ] Plan your security model before implementing
- [ ] Implement RLS policies BEFORE adding any data
- [ ] Test policies with actual queries
- [ ] Common policies to implement:
  ```sql
  -- Enable RLS
  ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
  
  -- Policy for users to read their own data
  CREATE POLICY "Users can read own data" ON your_table
    FOR SELECT USING (auth.uid() = user_id);
    
  -- Policy for users to insert their own data
  CREATE POLICY "Users can insert own data" ON your_table
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
  -- Policy for users to update their own data
  CREATE POLICY "Users can update own data" ON your_table
    FOR UPDATE USING (auth.uid() = user_id);
    
  -- Policy for users to delete their own data
  CREATE POLICY "Users can delete own data" ON your_table
    FOR DELETE USING (auth.uid() = user_id);
  ```
```The apply model made the following changes to the file:

```
- 
+ # Supabase Integration Guide for React Applications
+ 
+ This document provides a structured approach to integrating Supabase with a React application based on lessons learned from our "Recurring Nightmare" subscription management project.
+ 
+ ## Project Setup Sequence
+ 
+ Following this sequence will help avoid many common issues with Supabase integration:
+ 
+ ### 1. Initial Setup
+ 
+ - Create a new React project using your preferred tooling (Vite, Create React App, Next.js)
+ - Set up version control (Git) immediately
+ - Install essential dependencies including:
+   - TypeScript for type safety
+   - React Router for navigation (if not using Next.js)
+   - UI components library of choice
+ - Set up `.env` and `.env.example` files for environment variables
+ 
+ ### 2. Supabase Project Creation & Configuration
+ 
+ - Create a new Supabase project from the dashboard
+ - Save API credentials in a secure location
+ - Add credentials to your `.env` file:
+   ```
+   VITE_SUPABASE_URL=your-supabase-url-here
+   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
+   ```
+ - Install Supabase client libraries:
+   ```bash
+   npm install @supabase/supabase-js
+   ```
+ 
+ ### 3. Database Schema Design
+ 
+ - Design your database schema before creating any tables
+ - Create database tables using the Supabase SQL editor
+ - For subscription management, use a schema like:
+   ```sql
+   CREATE TABLE subscriptions (
+     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
+     user_id UUID REFERENCES auth.users(id),
+     name TEXT NOT NULL,
+     category TEXT NOT NULL,
+     cost DECIMAL NOT NULL,
+     "billingCycle" TEXT NOT NULL CHECK ("billingCycle" IN ('monthly', 'annually', 'quarterly')),
+     "nextBillingDate" TIMESTAMP WITH TIME ZONE NOT NULL,
+     url TEXT,
+     logo TEXT,
+     type TEXT NOT NULL CHECK (type IN ('personal', 'business-individual', 'business-team')),
+     "usageFrequency" TEXT CHECK ("usageFrequency" IN ('high', 'medium', 'low', 'none')),
+     created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
+     updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
+   );
+   ```
+ 
+ ### 4. Set Up Row Level Security (RLS)
+ 
+ - Enable RLS *before* creating your client application code:
+   ```sql
+   -- Enable RLS
+   ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
+   
+   -- Create policies for each operation
+   CREATE POLICY "Users can view their own subscriptions"
+     ON subscriptions FOR SELECT
+     USING (auth.uid() = user_id);
+   
+   CREATE POLICY "Users can insert their own subscriptions"
+     ON subscriptions FOR INSERT
+     WITH CHECK (auth.uid() = user_id);
+   
+   CREATE POLICY "Users can update their own subscriptions"
+     ON subscriptions FOR UPDATE
+     USING (auth.uid() = user_id);
+   
+   CREATE POLICY "Users can delete their own subscriptions"
+     ON subscriptions FOR DELETE
+     USING (auth.uid() = user_id);
+   ```
+ 
+ ### 5. Set Up Authentication Context
+ 
+ - Create an auth context provider early in your project
+ - Implement proper session persistence
+ - The auth context should handle:
+   - User sign-in, sign-up, and sign-out
+   - Session persistence between page refreshes
+   - Loading states while checking authentication
+   - Protected routes
+ 
+ ```typescript
+ // src/contexts/AuthContext.tsx
+ import React, { createContext, useContext, useState, useEffect } from 'react';
+ import { supabase } from '@/lib/supabase';
+ import type { User } from '@/types';
+ 
+ interface AuthContextType {
+   user: User | null;
+   loading: boolean;
+   signIn: (email: string, password: string) => Promise<void>;
+   signUp: (email: string, password: string) => Promise<void>;
+   signOut: () => Promise<void>;
+ }
+ 
+ const AuthContext = createContext<AuthContextType | undefined>(undefined);
+ 
+ export function AuthProvider({ children }) {
+   const [user, setUser] = useState<User | null>(null);
+   const [loading, setLoading] = useState(true);
+   
+   useEffect(() => {
+     // Check current user and set up auth listener
+     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
+       setUser(session?.user || null);
+       setLoading(false);
+     });
+     
+     // Get initial session
+     supabase.auth.getSession().then(({ data: { session } }) => {
+       setUser(session?.user || null);
+       setLoading(false);
+     });
+     
+     return () => subscription.unsubscribe();
+   }, []);
+   
+   // Implement auth methods here
+   
+   return (
+     <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
+       {children}
+     </AuthContext.Provider>
+   );
+ }
+ 
+ export function useAuth() {
+   const context = useContext(AuthContext);
+   if (context === undefined) {
+     throw new Error('useAuth must be used within an AuthProvider');
+   }
+   return context;
+ }
+ ```
+ 
+ ### 6. Initialize Supabase Client Properly
+ 
+ ```typescript
+ // src/lib/supabase.ts
+ import { createClient } from '@supabase/supabase-js';
+ 
+ const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
+ const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
+ 
+ if (!supabaseUrl || !supabaseAnonKey) {
+   throw new Error('Missing Supabase environment variables. Check your .env file.');
+ }
+ 
+ export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
+   auth: {
+     persistSession: true,
+     autoRefreshToken: true,
+     detectSessionInUrl: true
+   },
+ });
+ ```
+ 
+ ### 7. Create Service Files for Database Operations
+ 
+ - Keep database operations organized in service files
+ - Include proper error handling
+ - Implement type safety with TypeScript
+ 
+ ```typescript
+ // src/services/subscriptionService.ts
+ import { supabase } from '@/lib/supabase';
+ import type { Subscription } from '@/types';
+ 
+ export async function createSubscription(subscription: Omit<Subscription, 'id'>): Promise<Subscription | null> {
+   const { data, error } = await supabase
+     .from('subscriptions')
+     .insert(subscription)
+     .select()
+     .single();
+   
+   if (error) {
+     console.error('Error creating subscription:', error);
+     return null;
+   }
+   
+   return data;
+ }
+ 
+ export async function getSubscriptions(userId: string): Promise<Subscription[]> {
+   const { data, error } = await supabase
+     .from('subscriptions')
+     .select('*')
+     .eq('user_id', userId);
+   
+   if (error) {
+     console.error('Error fetching subscriptions:', error);
+     return [];
+   }
+   
+   return data || [];
+ }
+ ```
+ 
+ ### 8. Define Types for Your Data
+ 
+ - Create well-defined TypeScript interfaces
+ - Use these types consistently throughout your application
+ 
+ ```typescript
+ // src/types/index.ts
+ export interface User {
+   id: string;
+   email: string;
+   created_at?: string;
+ }
+ 
+ export type SubscriptionType = 'personal' | 'business-individual' | 'business-team';
+ export type BillingCycle = 'monthly' | 'annually' | 'quarterly';
+ 
+ export interface Subscription {
+   id: string;
+   user_id: string;
+   name: string;
+   category: string;
+   cost: number;
+   billingCycle: BillingCycle;
+   nextBillingDate: string;
+   url?: string;
+   logo?: string;
+   type: SubscriptionType;
+   usageFrequency?: 'high' | 'medium' | 'low' | 'none';
+   created_at?: string;
+   updated_at?: string;
+ }
+ ```
+ 
+ ### 9. Implement Authentication Components
+ 
+ - Create reusable components for sign-in, sign-up, etc.
+ - Use your auth context to manage authentication state
+ - Implement protected routes
+ 
+ ```tsx
+ // src/components/auth/ProtectedRoute.tsx
+ import React from 'react';
+ import { Navigate } from 'react-router-dom';
+ import { useAuth } from '@/contexts/AuthContext';
+ 
+ interface ProtectedRouteProps {
+   children: React.ReactNode;
+ }
+ 
+ const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
+   const { user, loading } = useAuth();
+ 
+   if (loading) {
+     return <div>Loading...</div>;
+   }
+ 
+   if (!user) {
+     return <Navigate to="/login" replace />;
+   }
+ 
+   return <>{children}</>;
+ };
+ 
+ export default ProtectedRoute;
+ ```
+ 
+ ### 10. Testing Authentication and Database Operations
+ 
+ Before proceeding with feature development, test these core functionalities:
+ 
+ - Sign up a test user
+ - Sign in with the test user
+ - Create a simple subscription entry
+ - Retrieve the subscription data
+ - Verify RLS policies are working correctly
+ 
+ ## Common Issues and Solutions
+ 
+ ### 1. Authentication Problems
+ 
+ **Issue**: User appears logged in but gets 401 errors when accessing data
+ 
+ **Solutions**:
+ - Ensure the token is being properly stored and sent with requests
+ - Check RLS policies to make sure they match your expected auth patterns
+ - Verify that the user_id in your data matches auth.uid()
+ - Test with a simple policy first: `USING (auth.role() = 'authenticated')`
+ 
+ ### 2. Data Access Issues
+ 
+ **Issue**: Unable to insert/update data despite being authenticated
+ 
+ **Solutions**:
+ - Temporarily disable RLS to test if it's a policy issue: `ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;`
+ - Check for SQL errors in the Supabase dashboard logs
+ - Ensure your data matches any CHECK constraints
+ - Verify the user_id is being set correctly in your service functions
+ 
+ ### 3. TypeScript Integration
+ 
+ **Issue**: Type errors when working with Supabase data
+ 
+ **Solutions**:
+ - Use the Supabase CLI to generate types from your database schema
+ - Define clear interfaces for your data structures
+ - Use proper type annotations for service functions
+ 
+ ### 4. Environment Variables
+ 
+ **Issue**: Supabase client can't connect
+ 
+ **Solutions**:
+ - Check that .env files are properly configured
+ - For Vite, ensure variables are prefixed with VITE_
+ - Verify the variables are being imported correctly
+ - Try hardcoding credentials temporarily (for testing only)
+ 
+ ## Progressive Development Approach
+ 
+ To avoid issues like we encountered in the Recurring Nightmare project, follow this methodical approach:
+ 
+ 1. Set up your database schema and RLS policies **first**
+ 2. Build and test authentication thoroughly before other features
+ 3. Create a simple CRUD operation and test it end-to-end
+ 4. Only after confirming basic operations work, build more complex features
+ 5. Add one feature at a time, testing thoroughly
+ 6. When issues arise, isolate and fix them before moving on
+ 
+ ## Debugging Tools
+ 
+ Add these debugging tools to your project to help troubleshoot issues:
+ 
+ ```tsx
+ // Debug component for testing database connection
+ const DebugTools = () => {
+   const { user } = useAuth();
+   const [result, setResult] = useState<any>(null);
+   
+   const testConnection = async () => {
+     try {
+       // Test auth status
+       const { data: authData } = await supabase.auth.getUser();
+       
+       // Test if we can query the database
+       const { data, error } = await supabase
+         .from('subscriptions')
+         .select('*')
+         .limit(1);
+       
+       setResult({
+         auth: authData,
+         data,
+         error
+       });
+     } catch (error) {
+       setResult({ error });
+     }
+   };
+   
+   return (
+     <div>
+       <button onClick={testConnection}>Test Connection</button>
+       {result && (
+         <pre>{JSON.stringify(result, null, 2)}</pre>
+       )}
+     </div>
+   );
+ };
+ ```
+ 
+ ## Conclusion
+ 
+ By following this structured approach, you'll avoid many of the common pitfalls of integrating Supabase with a React application. Taking a methodical, step-by-step approach is key to success, especially when working with authentication and database operations.
+ 
+ Remember:
+ - Set up your database schema and security policies first
+ - Test authentication thoroughly before building features
+ - Start with simple operations and build complexity gradually
+ - Use TypeScript for type safety
+ - Isolate and fix issues before moving on
+ - Keep your code organized with services and contexts
# Google Sheets Webhooks Setup Guide

## Overview

This guide explains how to set up Google Sheets webhooks to enable real-time updates in your PR tracking application. Instead of polling the API with time-based caching, the app will receive instant notifications when your spreadsheet changes.

## Prerequisites

- Your app is deployed to a public URL (e.g., Vercel deployment)
- You have access to Google Apps Script
- Admin access to your Google Sheets document

## Step 1: Deploy Your App

First, ensure your app is deployed to a publicly accessible URL:

```bash
# Deploy to Vercel
npm run build
vercel --prod
```

Note your deployment URL (e.g., `https://your-app.vercel.app`)

## Step 2: Create Google Apps Script

1. Open your Google Sheets document
2. Go to `Extensions` > `Apps Script`
3. Replace the default code with the following:

```javascript
// Google Apps Script code for webhook notifications
function onEdit(e) {
  // Get the webhook URL - replace with your actual deployment URL
  const WEBHOOK_URL = 'https://your-app.vercel.app/api/webhooks/sheets';
  
  // Get information about the edit
  const editInfo = {
    eventType: 'SHEET',
    sheetName: e.source.getActiveSheet().getName(),
    range: e.range.getA1Notation(),
    oldValue: e.oldValue,
    newValue: e.value,
    timestamp: new Date().toISOString(),
    user: Session.getActiveUser().getEmail()
  };
  
  // Send webhook notification
  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(editInfo)
    });
    
    console.log('Webhook sent successfully:', response.getContentText());
  } catch (error) {
    console.error('Failed to send webhook:', error);
  }
}

// Optional: Manual trigger for testing
function testWebhook() {
  const WEBHOOK_URL = 'https://your-app.vercel.app/api/webhooks/sheets';
  
  const testData = {
    eventType: 'TEST',
    message: 'Manual webhook test',
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(testData)
    });
    
    console.log('Test webhook response:', response.getContentText());
  } catch (error) {
    console.error('Test webhook failed:', error);
  }
}
```

## Step 3: Configure the Script

1. **Update the webhook URL**: Replace `https://your-app.vercel.app` with your actual deployment URL
2. **Save the script**: `Ctrl+S` or `Cmd+S`
3. **Name your project**: Give it a meaningful name like "PR Tracker Webhooks"

## Step 4: Set Up Triggers

1. In Apps Script, click the **Triggers** icon (⏰) in the left sidebar
2. Click **+ Add Trigger**
3. Configure the trigger:
   - **Choose function**: `onEdit`
   - **Event source**: `From spreadsheet`
   - **Event type**: `On edit`
   - **Failure notification settings**: `Notify me immediately`
4. Click **Save**

## Step 5: Grant Permissions

1. When prompted, click **Review permissions**
2. Select your Google account
3. Click **Advanced** if you see a warning
4. Click **Go to PR Tracker Webhooks (unsafe)**
5. Click **Allow**

## Step 6: Test the Setup

### Test 1: Manual Test Function
1. In Apps Script, select the `testWebhook` function
2. Click **Run**
3. Check the console for success/error messages

### Test 2: Edit Your Spreadsheet
1. Make a change to any cell in your "Client Permissions" sheet
2. Check your app's server logs for webhook received messages
3. Verify that the app data updates without manual refresh

## Step 7: Verify Webhook Endpoint

You can test the webhook endpoint directly:

```bash
# Test the webhook endpoint
curl -X POST https://your-app.vercel.app/api/webhooks/sheets \
  -H "Content-Type: application/json" \
  -d '{"eventType":"TEST","message":"Manual test"}'

# Check webhook status
curl https://your-app.vercel.app/api/webhooks/sheets
```

## Troubleshooting

### Common Issues

1. **Webhook not firing**:
   - Check that the trigger is properly configured
   - Verify the webhook URL is correct
   - Check Apps Script execution logs

2. **CORS errors**:
   - Ensure your deployment URL is correct
   - Check that the webhook endpoint is properly deployed

3. **Permission issues**:
   - Re-run the authorization flow
   - Check that the script has edit permissions

4. **Quota limits**:
   - Apps Script has daily execution quotas
   - Monitor usage in the Apps Script dashboard

### Debug Steps

1. **Check Apps Script logs**:
   - Go to Apps Script > Executions
   - Look for errors in recent runs

2. **Check app server logs**:
   - View Vercel function logs
   - Look for "Webhook received" messages

3. **Test manually**:
   - Use the `testWebhook` function
   - Make small edits to test cells

## Benefits of Webhook-Based Updates

✅ **Real-time updates**: Changes appear instantly  
✅ **No API quota waste**: Only fetches when data actually changes  
✅ **Better performance**: No polling overhead  
✅ **Efficient caching**: Data stays cached until actual changes occur  
✅ **Reduced load**: Fewer unnecessary API requests  

## Advanced Configuration

### Multiple Sheet Monitoring
To monitor specific sheets only:

```javascript
function onEdit(e) {
  const MONITORED_SHEETS = ['Client Permissions', 'Media Tracker', 'Awards'];
  const sheetName = e.source.getActiveSheet().getName();
  
  if (!MONITORED_SHEETS.includes(sheetName)) {
    return; // Don't send webhook for other sheets
  }
  
  // ... rest of webhook code
}
```

### Rate Limiting
To prevent too many webhooks:

```javascript
const RATE_LIMIT_MS = 5000; // 5 seconds
let lastWebhookTime = 0;

function onEdit(e) {
  const now = Date.now();
  if (now - lastWebhookTime < RATE_LIMIT_MS) {
    return; // Skip if too soon
  }
  lastWebhookTime = now;
  
  // ... rest of webhook code
}
``` 
# PR Tracker Application - Project Vision & Plan

## Overview
A comprehensive PR tracking application that provides beautiful, data-driven insights into media relations, coverage, awards, events, and outreach activities. All data is sourced from connected Google Sheets.

## Core Vision

### Landing Page (Overview Dashboard)
**Purpose**: Beautiful, consumable overview of the most relevant data across all sheets
**Key Features**:
- Recent activity highlights (press mentions, awards submitted/won, pitch acceptance rates)
- Trend analysis (monthly/quarterly, eventually annual)
- Key performance indicators and metrics
- Visual data representation

### Navigation Structure

#### 1. **Dashboard** (Primary Landing)
- **What happened recently**: Recent press mentions, awards submitted/won, article pitches vs accepted
- **Trend analysis**: Performance by month/quarter, annual when applicable
- **Key metrics**: Overall performance indicators
- **Data sources**: All Google Sheet worksheets as relevant

#### 2. **Coverage Page**
- **Layout**: Reverse chronological order of latest press coverage
- **Features**:
  - Links to press articles (when URLs provided)
  - Complete article information: Publisher, circulation/readership, writer
  - Use web search to enrich data with missing circulation/readership info
  - Determine available fields dynamically from Google Sheet data
- **Data source**: Media Tracker worksheet

#### 3. **Awards Page**
- **Categories**: Submitted, Won, Upcoming
- **Features**:
  - Timeline view of awards process
  - Status tracking (submitted → shortlisted → won/lost)
  - Deadline management for upcoming opportunities
- **Data source**: Awards worksheet

#### 4. **Events Page**
- **Focus**: Upcoming events and speaking opportunities
- **Features**:
  - Visual calendar/timeline representation
  - Event details and preparation status
  - Potentially use shadcn.com components (implement separately/carefully)
- **Data source**: Speaking Opps worksheet

#### 5. **Outreach Page**
- **Purpose**: Enhanced visualization of media outreach activities
- **Features**:
  - Contact management and relationship tracking
  - Outreach status and response rates
  - More visually appealing than current implementation
- **Data source**: Media Relations worksheet

#### 6. **All Data** (Current Worksheets view)
- **Purpose**: Technical access to all worksheet data
- **Maintain**: Current functionality for complete data access

## Technical Requirements

### Header/Branding
- Use `oswf.png` logo prominently in header
- Logo should be large enough to read clearly
- Remove redundant text next to logo (logo contains the name)
- Maintain current gradient background and mobile responsiveness

### Data Integration
- Continue using Google Sheets API
- Dynamic field detection from sheets
- Web search integration for data enrichment (circulation numbers, etc.)
- Real-time data updates where possible

### UI/UX Principles
- Beautiful, modern presentation
- Easy data consumption
- Mobile-responsive design
- Professional appearance suitable for PR industry

## Implementation Strategy

### Phase 1: Foundation
1. Update header to use logo properly
2. Consolidate Analytics/Dashboard into single Dashboard page
3. Restructure navigation

### Phase 2: Core Pages
1. Dashboard (landing page with overview)
2. Coverage page with enhanced data
3. Awards page with status tracking
4. Outreach page improvements

### Phase 3: Advanced Features
1. Events page with visual components (separate implementation)
2. Web search data enrichment
3. Advanced analytics and trending

### Phase 4: Polish
1. Performance optimization
2. Enhanced mobile experience
3. Additional data visualizations

## Success Metrics
- Easy identification of recent PR wins
- Clear trend visualization
- Comprehensive coverage tracking
- Efficient award submission management
- Streamlined outreach process
- Professional presentation for client/stakeholder review

## Notes
- Avoid breaking existing functionality
- Implement visual components (shadcn) separately from other features
- Focus on data accuracy and presentation quality
- Maintain existing Google Sheets integration
- Preserve current deployment setup 
import { supabase } from './supabase';
import { fetchCoverageData, fetchOutreachData, fetchEventsData } from './sheets';

/**
 * Synchronize coverage data from Google Sheets to Supabase
 */
export async function syncCoverageData() {
  try {
    // Fetch data from Google Sheets
    const coverageData = await fetchCoverageData();
    
    // Clear existing data (optional - depends on your sync strategy)
    await supabase.from('coverage').delete().not('id', 'is', null);
    
    // Insert new data from Google Sheets
    const { error } = await supabase
      .from('coverage')
      .insert(coverageData);
      
    if (error) {
      throw error;
    }
    
    return { success: true, count: coverageData.length };
  } catch (error) {
    console.error('Error syncing coverage data:', error);
    return { success: false, error };
  }
}

/**
 * Synchronize outreach data from Google Sheets to Supabase
 */
export async function syncOutreachData() {
  try {
    // Fetch data from Google Sheets
    const outreachData = await fetchOutreachData();
    
    // Clear existing data (optional - depends on your sync strategy)
    await supabase.from('outreach').delete().not('id', 'is', null);
    
    // Insert new data from Google Sheets
    const { error } = await supabase
      .from('outreach')
      .insert(outreachData);
      
    if (error) {
      throw error;
    }
    
    return { success: true, count: outreachData.length };
  } catch (error) {
    console.error('Error syncing outreach data:', error);
    return { success: false, error };
  }
}

/**
 * Synchronize events data from Google Sheets to Supabase
 */
export async function syncEventsData() {
  try {
    // Fetch data from Google Sheets
    const eventsData = await fetchEventsData();
    
    // Clear existing data (optional - depends on your sync strategy)
    await supabase.from('events').delete().not('id', 'is', null);
    
    // Insert new data from Google Sheets
    const { error } = await supabase
      .from('events')
      .insert(eventsData);
      
    if (error) {
      throw error;
    }
    
    return { success: true, count: eventsData.length };
  } catch (error) {
    console.error('Error syncing events data:', error);
    return { success: false, error };
  }
}

/**
 * Synchronize all data from Google Sheets to Supabase
 */
export async function syncAllData() {
  const results = {
    coverage: await syncCoverageData(),
    outreach: await syncOutreachData(),
    events: await syncEventsData(),
  };
  
  return {
    success: results.coverage.success && results.outreach.success && results.events.success,
    results
  };
} 
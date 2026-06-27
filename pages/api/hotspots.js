import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const csvPath = path.join(process.cwd(), 'public/data/mumbai_hotspots.csv');
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      // Return sample data if CSV not found
      return res.status(200).json([
        { lat: 19.0760, lng: 72.8777, temperature: 42.5, severity: 'extreme', name: 'Mumbai Central' },
        { lat: 19.0850, lng: 72.8900, temperature: 38.2, severity: 'high', name: 'Bandra' },
        { lat: 19.0700, lng: 72.8600, temperature: 35.0, severity: 'moderate', name: 'Worli' },
        { lat: 19.0950, lng: 72.8800, temperature: 31.5, severity: 'low', name: 'Andheri' },
        { lat: 19.0500, lng: 72.8400, temperature: 40.0, severity: 'high', name: 'Lower Parel' },
        { lat: 19.1100, lng: 72.9100, temperature: 33.0, severity: 'moderate', name: 'Ghatkopar' },
      ]);
    }
    
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return res.status(200).json([]);
    }
    
    const headers = lines[0].split(',');
    const latIdx = headers.findIndex(h => h.includes('lat') || h.includes('latitude'));
    const lngIdx = headers.findIndex(h => h.includes('lon') || h.includes('lng') || h.includes('longitude'));
    const uhiIdx = headers.findIndex(h => h.includes('all_daytime_UHI') || h.includes('UHI') || h.includes('uhi'));
    
    const hotspots = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length <= Math.max(latIdx, lngIdx, uhiIdx)) continue;
      
      const uhi = parseFloat(values[uhiIdx]);
      if (isNaN(uhi)) continue;
      
      let severity = 'low';
      if (uhi > 4) severity = 'extreme';
      else if (uhi > 3) severity = 'high';
      else if (uhi > 2) severity = 'moderate';
      
      const temperature = 30 + (uhi * 2);
      
      hotspots.push({
        lat: parseFloat(values[latIdx]),
        lng: parseFloat(values[lngIdx]),
        temperature: temperature,
        severity: severity,
        uhi: uhi,
        name: `Hotspot ${i}`
      });
    }
    
    res.status(200).json(hotspots);
  } catch (error) {
    console.error('Error loading hotspot data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
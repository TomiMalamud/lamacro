import * as fs from 'fs';

// Function to transform the data
function transformInflationData(inputData: string) {
  // First, ensure we have valid JSON by wrapping in brackets if needed
  const jsonString = inputData.startsWith('[') ? inputData : `[${inputData}]`;
  
  // Parse the input data
  const data = JSON.parse(jsonString);
  
  // Create the transformed structure
  const transformed: Record<string, Record<number, number>> = {};
  
  // Process each record
  data.forEach((record: { fecha: string; valor: number }) => {
    // Parse the date
    const date = new Date(record.fecha);
    const year = date.getFullYear().toString();
    const month = date.getMonth() + 1; // Convert to 1-based month
    
    // Convert percentage to decimal and round to 3 decimal places
    const value = Number((record.valor / 100).toFixed(3));
    
    // Initialize year object if it doesn't exist
    if (!transformed[year]) {
      transformed[year] = {};
    }
    
    // Add the value
    transformed[year][month] = value;
  });
  
  return transformed;
}

// Main execution
try {
  // Read input file (assuming the data is saved as JSON)
  const inputData = fs.readFileSync('lib/input-data.json', 'utf8');
  
  // Transform the data
  const transformed = transformInflationData(inputData);
  
  // Save as minified JSON
  fs.writeFileSync(
    'historical-inflation.json',
    JSON.stringify(transformed),
    'utf8'
  );
  
  console.log('Transformation completed successfully!');
  
  // Log some stats
  const years = Object.keys(transformed);
  const totalMonths = years.reduce((acc, year) => 
    acc + Object.keys(transformed[year]).length, 0
  );
  
  console.log(`Total years: ${years.length}`);
  console.log(`Total months: ${totalMonths}`);
  console.log(`First year: ${years[0]}`);
  console.log(`Last year: ${years[years.length - 1]}`);
  
} catch (error) {
  console.error('Error processing data:', error);
}
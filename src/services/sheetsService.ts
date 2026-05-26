import { getAccessToken } from './authService';
import { LedgerEntry, ClientProfile } from '../lib/types';
import { format } from 'date-fns';

export interface SheetData {
  clients: ClientProfile[];
  ledger: LedgerEntry[];
}

export const exportToSheets = async (data: SheetData) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  // 1. Create a new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Supari Ledger Export - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Failed to create spreadsheet');
  }

  const { spreadsheetId, spreadsheetUrl } = await createRes.json();

  // 2. Prepare headers and rows for Ledger
  const headers = ['Date', 'Client Name', 'Weight', 'Rate', 'Total Valuation', 'Amount Paid', 'Outstanding Balance', 'Status', 'Notes'];
  const rows = data.ledger.map(entry => {
    const client = data.clients.find(c => c.id === entry.clientId);
    return [
      entry.date,
      client?.fullName || 'Unknown',
      entry.weight,
      entry.rate,
      entry.totalValuation,
      entry.amountPaid,
      entry.outstandingBalance,
      entry.paymentStatus,
      entry.notes
    ];
  });

  const values = [headers, ...rows];

  // 3. Update the spreadsheet with data
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:I${values.length}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values,
    }),
  });

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err.error?.message || 'Failed to populate spreadsheet');
  }

  return { spreadsheetId, spreadsheetUrl };
};

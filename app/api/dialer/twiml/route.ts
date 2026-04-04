// No auth -- this endpoint is called directly by Twilio to fetch TwiML instructions
export async function GET() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
</Response>`

  return new Response(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/seat-occupancy?labId=cmdo87bn4000bvrhchtj411ao' -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
$ds01 = $data.computers | Where-Object { $_.name -eq 'DS-01' }

Write-Output "DS-01 Status:"
Write-Output "Name: $($ds01.name)"
Write-Output "Occupancy Status: $($ds01.occupancyStatus)"
Write-Output "Is Available: $($ds01.isAvailable)"
Write-Output "Has Booking: $($ds01.currentBooking -ne $null)"

if ($ds01.currentBooking) {
    Write-Output "Booking User: $($ds01.currentBooking.userName)"
    Write-Output "Start Time: $($ds01.currentBooking.startTime)"
    Write-Output "End Time: $($ds01.currentBooking.endTime)"
    Write-Output "Status: $($ds01.currentBooking.status)"
}

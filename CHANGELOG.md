# Changelog

## [4.0.0]

#### Notes

- Upgrades the SDK to target the latest verison of Link: v4.
- Adds support for a new set of bill and account lifecycle events.

#### Breaking Changes

- The `billRemoved` event handler now uses `PinwheelBillEvent` instead of `PinwheelBillSwitchEvent`.

#### Non-breaking Changes

- An optional `accountId` field has been added to `PinwheelBillSwitchPayload`.

#### New event types

- `billSwitchFailure`
- `billAdded`
- `billEdited`
- `billMarkedInactive`
- `billSwitchPlatformsAdded`
- `billSwitchPlatformsRemoved`
- `billCancelSuccess`
- `billCancelFailure`
- `calendarSync`
- `customerTermsAccepted`
- `userActivated`

## [3.0.0]

- ** Initial Release **
- ** Add support for Capacitor 6/7/8 **

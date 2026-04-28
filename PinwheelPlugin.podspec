require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'PinwheelPlugin'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = 'https://getpinwheel.com'
  s.author = package['author']
  s.source = { :path => '.' }
  s.source_files = 'ios/Sources/**/*.{swift,h,m,mm}'
  s.ios.deployment_target = '15.0'
  s.dependency 'Capacitor'
  # PinwheelSDK >= 3.5.0 implements the full PINWHEEL_INTERNAL_COMM_* edge-native
  # postMessage bridge required by Pinwheel Link. Earlier versions are missing some
  # event handlers (storage_get/_set, homer_open, auth_request) and would silently
  # break edge-native flows.
  s.dependency 'PinwheelSDK', '~> 3.5'
  s.swift_version = '5.1'
end

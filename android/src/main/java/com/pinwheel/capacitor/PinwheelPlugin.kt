package com.pinwheel.capacitor

import android.os.Handler
import android.os.Looper
import androidx.fragment.app.FragmentManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.pinwheel.capacitor.BuildConfig
import com.underdog_tech.pinwheel_android.PinwheelEventListener
import com.underdog_tech.pinwheel_android.PinwheelFragment
import com.underdog_tech.pinwheel_android.model.PinwheelAllocation
import com.underdog_tech.pinwheel_android.model.PinwheelBillEventPayload
import com.underdog_tech.pinwheel_android.model.PinwheelBillSwitchEventPayload
import com.underdog_tech.pinwheel_android.model.PinwheelBillSwitchPlatformsAddedEventPayload
import com.underdog_tech.pinwheel_android.model.PinwheelCalendarSyncEventPayload
import com.underdog_tech.pinwheel_android.model.PinwheelDDFormCreatePayload
import com.underdog_tech.pinwheel_android.model.PinwheelError
import com.underdog_tech.pinwheel_android.model.PinwheelEventPayload
import com.underdog_tech.pinwheel_android.model.PinwheelEventType
import com.underdog_tech.pinwheel_android.model.PinwheelExternalAccountConnectedPayload
import com.underdog_tech.pinwheel_android.model.PinwheelInputAllocationPayload
import com.underdog_tech.pinwheel_android.model.PinwheelLoginAttemptPayload
import com.underdog_tech.pinwheel_android.model.PinwheelLoginPayload
import com.underdog_tech.pinwheel_android.model.PinwheelOtherEventPayload
import com.underdog_tech.pinwheel_android.model.PinwheelParams
import com.underdog_tech.pinwheel_android.model.PinwheelResult
import com.underdog_tech.pinwheel_android.model.PinwheelScreenTransitionPayload
import com.underdog_tech.pinwheel_android.model.PinwheelSelectedEmployerPayload
import com.underdog_tech.pinwheel_android.model.PinwheelSelectedPlatformPayload
import com.underdog_tech.pinwheel_android.model.PinwheelTarget
import com.underdog_tech.pinwheel_android.model.PinwheelUserActivatedEventPayload

@CapacitorPlugin(name = "Pinwheel")
class PinwheelPlugin : Plugin(), PinwheelEventListener {
    private var pinwheelFragment: PinwheelFragment? = null

    @PluginMethod
    fun open(call: PluginCall) {
        val token = call.getString("linkToken")
        if (token.isNullOrBlank()) {
            call.reject("linkToken is required")
            return
        }

        val useDarkMode = call.getBoolean("useDarkMode") ?: false
        // The JS layer always passes the wrapper's `package.json` version via
        // `Pinwheel.open()`. We fall back to `BuildConfig.WRAPPER_VERSION` (read at
        // build time from package.json — see android/build.gradle) so the value
        // forwarded to Pinwheel Link / Newton stays in sync with the published
        // wrapper, never the legacy "0.0.1" / "unknown" placeholder.
        val sdkVersion = call.getString("sdkVersion") ?: BuildConfig.WRAPPER_VERSION

        Handler(Looper.getMainLooper()).post {
            val activity = activity
            if (activity == null) {
                call.reject("No activity available")
                return@post
            }

            val fragmentManager = activity.supportFragmentManager
            dismissFragment()

            pinwheelFragment = PinwheelFragment.newInstanceWithAdvancedOptions(
                token,
                // Pinwheel Link validates this string strictly.
                "capacitor",
                sdkVersion,
                null,
                true,
                useDarkMode
            ).apply {
                pinwheelEventListener = this@PinwheelPlugin
            }

            fragmentManager.beginTransaction()
                .add(android.R.id.content, pinwheelFragment!!, FRAGMENT_TAG)
                .addToBackStack(FRAGMENT_TAG)
                .commit()

            call.resolve()
        }
    }

    @PluginMethod
    fun close(call: PluginCall) {
        Handler(Looper.getMainLooper()).post {
            if (activity == null) {
                call.reject("No activity available")
                return@post
            }
            dismissFragment()
            call.resolve()
        }
    }

    override fun handleOnDestroy() {
        // Capacitor lifecycle: ensure the fragment and its strong reference back to
        // this plugin are released when the host activity is destroyed, so we don't
        // leak the plugin (or the listener) across config changes / process kills.
        // iOS gets equivalent cleanup automatically when the presented VC is
        // dismissed and the delegate reference is dropped.
        dismissFragment()
        super.handleOnDestroy()
    }

    /**
     * Pop the fragment off the back stack, clear the listener reference held by
     * `PinwheelFragment` (which otherwise keeps this plugin alive indefinitely),
     * and null our local reference. Safe to call multiple times.
     */
    private fun dismissFragment() {
        val activity = activity ?: return
        val fragmentManager = activity.supportFragmentManager
        pinwheelFragment?.let { fragment ->
            fragment.pinwheelEventListener = null
        }
        if (fragmentManager.findFragmentByTag(FRAGMENT_TAG) != null) {
            fragmentManager.popBackStackImmediate(FRAGMENT_TAG, FragmentManager.POP_BACK_STACK_INCLUSIVE)
        }
        fragmentManager.findFragmentByTag(FRAGMENT_TAG)?.let { fragment ->
            fragmentManager.beginTransaction().remove(fragment).commitAllowingStateLoss()
            fragmentManager.executePendingTransactions()
        }
        pinwheelFragment = null
    }

    override fun onEvent(eventName: PinwheelEventType, payload: PinwheelEventPayload?) {
        val name = eventName.toString().lowercase()
        val payloadObj = payload?.toJSObject()

        val data = JSObject().apply {
            put("name", name)
            if (payloadObj != null) {
                put("payload", payloadObj)
            }
        }
        notifyListeners("event", data)

        // Convenience channels (parity with iOS delegate callbacks).
        when (name) {
            "success" -> notifyListeners("success", payloadObj ?: JSObject())
            "login" -> notifyListeners("login", payloadObj ?: JSObject())
            "login_attempt" -> notifyListeners("loginAttempt", payloadObj ?: JSObject())
            "error" -> notifyListeners("error", payloadObj ?: JSObject())
            "exit" -> {
                val exitData = JSObject()
                if (payloadObj != null) {
                    exitData.put("error", payloadObj)
                }
                notifyListeners("exit", exitData)
            }
        }

        if (name == "exit") {
            Handler(Looper.getMainLooper()).post {
                dismissFragment()
            }
        }
    }

    private companion object {
        private const val FRAGMENT_TAG = "PinwheelFragment"
    }
}

private fun PinwheelTarget.toJSObject(): JSObject {
    return JSObject().apply {
        put("accountType", this@toJSObject.accountType)
        put("accountName", this@toJSObject.accountName)
    }
}

private fun PinwheelAllocation.toJSObject(): JSObject {
    return JSObject().apply {
        put("type", this@toJSObject.type)
        this@toJSObject.value?.let { put("value", it.toDouble()) }
        put("target", this@toJSObject.target?.toJSObject())
    }
}

private fun PinwheelParams.toJSObject(): JSObject {
    return JSObject().apply {
        put("action", this@toJSObject.action)
        put("allocation", this@toJSObject.allocation?.toJSObject())
    }
}

private fun PinwheelEventPayload.toJSObject(): JSObject = when (this) {
    is PinwheelInputAllocationPayload -> JSObject().apply {
        put("action", this@toJSObject.action)
        put("allocation", this@toJSObject.allocation?.toJSObject())
    }

    is PinwheelResult -> JSObject().apply {
        put("accountId", this@toJSObject.accountId)
        put("platformId", this@toJSObject.platformId)
        put("job", this@toJSObject.job)
        put("params", this@toJSObject.params?.toJSObject())
    }

    is PinwheelError -> JSObject().apply {
        put("type", this@toJSObject.type)
        put("code", this@toJSObject.code)
        put("message", this@toJSObject.message)
        put("pendingRetry", this@toJSObject.pendingRetry)
    }

    is PinwheelSelectedEmployerPayload -> JSObject().apply {
        put("selectedEmployerId", this@toJSObject.selectedEmployerId)
        put("selectedEmployerName", this@toJSObject.selectedEmployerName)
    }

    is PinwheelSelectedPlatformPayload -> JSObject().apply {
        put("selectedPlatformId", this@toJSObject.selectedPlatformId)
        put("selectedPlatformName", this@toJSObject.selectedPlatformName)
    }

    is PinwheelLoginPayload -> JSObject().apply {
        put("accountId", this@toJSObject.accountId)
        put("platformId", this@toJSObject.platformId)
    }

    is PinwheelLoginAttemptPayload -> JSObject().apply {
        put("platformId", this@toJSObject.platformId)
    }

    is PinwheelDDFormCreatePayload -> JSObject().apply {
        put("url", this@toJSObject.url)
    }

    is PinwheelScreenTransitionPayload -> JSObject().apply {
        put("screenName", this@toJSObject.screenName)
        put("selectedEmployerId", this@toJSObject.selectedEmployerId)
        put("selectedEmployerName", this@toJSObject.selectedEmployerName)
        put("selectedPlatformId", this@toJSObject.selectedPlatformId)
        put("selectedPlatformName", this@toJSObject.selectedPlatformName)
    }

    is PinwheelOtherEventPayload -> JSObject().apply {
        put("name", this@toJSObject.name)
        val payloadArray = this@toJSObject.payload.map { item ->
            JSObject().apply {
                put("key", item.key)
                put("value", item.value)
                put("type", item.type.name)
            }
        }
        put("payload", payloadArray)
    }

    is PinwheelBillSwitchEventPayload -> JSObject().apply {
        put("platformId", this@toJSObject.platformId)
        put("platformName", this@toJSObject.platformName)
        put("isIntegratedSwitch", this@toJSObject.isIntegratedSwitch)
        put("frequency", this@toJSObject.frequency)
        put("nextPaymentDate", this@toJSObject.nextPaymentDate)
        put("amountCents", this@toJSObject.amountCents)
        this@toJSObject.accountId?.let { put("accountId", it) }
    }

    is PinwheelBillEventPayload -> JSObject().apply {
        put("platformId", this@toJSObject.platformId)
        put("platformName", this@toJSObject.platformName)
        put("frequency", this@toJSObject.frequency)
        put("nextPaymentDate", this@toJSObject.nextPaymentDate)
        put("amountCents", this@toJSObject.amountCents)
    }

    is PinwheelBillSwitchPlatformsAddedEventPayload -> JSObject().apply {
        put("platforms", this@toJSObject.platforms.map { platform ->
            JSObject().apply {
                put("id", platform.id)
                put("name", platform.name)
            }
        })
    }

    is PinwheelCalendarSyncEventPayload -> JSObject().apply {
        put("calendarType", this@toJSObject.calendarType.name.lowercase())
    }

    is PinwheelUserActivatedEventPayload -> JSObject().apply {
        put("solutionName", this@toJSObject.solutionName)
    }

    is PinwheelExternalAccountConnectedPayload -> JSObject().apply {
        put("institutionName", this@toJSObject.institutionName)
        put("accountName", this@toJSObject.accountName)
    }

    else -> JSObject()
}

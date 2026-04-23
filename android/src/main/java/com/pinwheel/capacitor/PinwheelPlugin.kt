package com.pinwheel.capacitor

import android.os.Handler
import android.os.Looper
import androidx.fragment.app.FragmentManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.underdog_tech.pinwheel_android.PinwheelEventListener
import com.underdog_tech.pinwheel_android.PinwheelFragment
import com.underdog_tech.pinwheel_android.model.PinwheelAllocation
import com.underdog_tech.pinwheel_android.model.PinwheelBillSwitchEventPayload
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
        val useSecureOrigin = call.getBoolean("useSecureOrigin") ?: false
        val sdkVersion = call.getString("sdkVersion") ?: "0.0.1"

        Handler(Looper.getMainLooper()).post {
            val activity = activity
            if (activity == null) {
                call.reject("No activity available")
                return@post
            }

            val fragmentManager = activity.supportFragmentManager
            val tag = "PinwheelFragment"

            fragmentManager.popBackStack(tag, FragmentManager.POP_BACK_STACK_INCLUSIVE)

            pinwheelFragment = PinwheelFragment.newInstanceWithAdvancedOptions(
                token,
                // Pinwheel Link validates this string strictly.
                "android",
                sdkVersion,
                null,
                true,
                useDarkMode,
                useSecureOrigin
            ).apply {
                pinwheelEventListener = this@PinwheelPlugin
            }

            fragmentManager.beginTransaction()
                .add(android.R.id.content, pinwheelFragment!!, tag)
                .addToBackStack(tag)
                .commit()

            call.resolve()
        }
    }

    @PluginMethod
    fun close(call: PluginCall) {
        Handler(Looper.getMainLooper()).post {
            val activity = activity
            if (activity == null) {
                call.reject("No activity available")
                return@post
            }

            val fragmentManager = activity.supportFragmentManager
            pinwheelFragment?.let { fragment ->
                fragmentManager.beginTransaction()
                    .remove(fragment)
                    .commit()
                pinwheelFragment = null
            }
            call.resolve()
        }
    }

    override fun onEvent(eventName: PinwheelEventType, payload: PinwheelEventPayload?) {
        val name = eventName.toString()
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
                pinwheelFragment?.let { fragment ->
                    activity?.supportFragmentManager?.beginTransaction()?.remove(fragment)?.commit()
                    pinwheelFragment = null
                }
            }
        }
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
    }

    is PinwheelExternalAccountConnectedPayload -> JSObject().apply {
        put("institutionName", this@toJSObject.institutionName)
        put("accountName", this@toJSObject.accountName)
    }

    else -> JSObject()
}

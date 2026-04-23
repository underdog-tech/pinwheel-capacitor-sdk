package com.pinwheel.capacitor

import com.getcapacitor.Plugin
import com.getcapacitor.PluginPackage

class PinwheelPluginPackage : PluginPackage {
    override fun createPlugins(): List<Class<out Plugin>> {
        return listOf(PinwheelPlugin::class.java)
    }
}

package com.example.houchi.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.pointDataStore by preferencesDataStore(name = "point_prefs")

class PointStorage(private val context: Context) {

    companion object {
        private val POINTS_KEY = intPreferencesKey("total_points")
    }

    val pointsFlow: Flow<Int> = context.pointDataStore.data.map { prefs ->
        prefs[POINTS_KEY] ?: 0
    }

    suspend fun addPoints(amount: Int) {
        context.pointDataStore.edit { prefs ->
            prefs[POINTS_KEY] = (prefs[POINTS_KEY] ?: 0) + amount
        }
    }

    suspend fun resetPoints() {
        context.pointDataStore.edit { prefs ->
            prefs[POINTS_KEY] = 0
        }
    }
}

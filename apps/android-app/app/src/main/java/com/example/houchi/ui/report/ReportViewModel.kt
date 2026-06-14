package com.example.houchi.ui.report

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.houchi.data.repository.ReportRepository
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class ReportUiState(
    val photoUri: Uri? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val markerCode: String = "",
    val isLocationLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
    val isSubmitted: Boolean = false,
    val showQrScanner: Boolean = false
)

class ReportViewModel(
    private val repository: ReportRepository,
    private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReportUiState())
    val uiState: StateFlow<ReportUiState> = _uiState

    fun onPhotoCaptured(uri: Uri) {
        _uiState.value = _uiState.value.copy(photoUri = uri)
    }

    fun onMarkerCodeChange(code: String) {
        _uiState.value = _uiState.value.copy(markerCode = code, errorMessage = null)
    }

    fun retakePhoto() {
        _uiState.value = _uiState.value.copy(photoUri = null)
    }

    fun showQrScanner() {
        _uiState.value = _uiState.value.copy(showQrScanner = true)
    }

    fun onQrDetected(code: String) {
        _uiState.value = _uiState.value.copy(markerCode = code, showQrScanner = false)
    }

    fun dismissQrScanner() {
        _uiState.value = _uiState.value.copy(showQrScanner = false)
    }

    @SuppressLint("MissingPermission")
    fun fetchLocation() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLocationLoading = true)
            try {
                val fusedClient = LocationServices.getFusedLocationProviderClient(context)
                val location = fusedClient
                    .getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                    .await()
                if (location != null) {
                    _uiState.value = _uiState.value.copy(
                        latitude = location.latitude,
                        longitude = location.longitude,
                        isLocationLoading = false
                    )
                } else {
                    // フォールバック: 最後の既知位置を使用
                    val lastLocation = fusedClient.lastLocation.await()
                    _uiState.value = _uiState.value.copy(
                        latitude = lastLocation?.latitude,
                        longitude = lastLocation?.longitude,
                        isLocationLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLocationLoading = false)
            }
        }
    }

    fun submitReport() {
        val state = _uiState.value
        val uri = state.photoUri ?: run {
            _uiState.value = state.copy(errorMessage = "写真を撮影してください")
            return
        }
        if (state.markerCode.isBlank()) {
            _uiState.value = state.copy(errorMessage = "マーカーコードを入力してください")
            return
        }
        if (state.latitude == null || state.longitude == null) {
            _uiState.value = state.copy(errorMessage = "位置情報を取得中です。しばらくお待ちください")
            return
        }
        viewModelScope.launch {
            _uiState.value = state.copy(isSubmitting = true, errorMessage = null)
            val result = repository.submitReport(uri, state.latitude, state.longitude, state.markerCode)
            _uiState.value = if (result.isSuccess) {
                state.copy(isSubmitting = false, isSubmitted = true)
            } else {
                state.copy(isSubmitting = false, errorMessage = result.exceptionOrNull()?.message)
            }
        }
    }
}

package com.example.houti.data.repository

import android.content.Context
import android.net.Uri
import com.example.houti.data.api.ApiClient
import com.example.houti.data.local.TokenStorage
import kotlinx.coroutines.flow.first
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream

class ReportRepository(
    private val context: Context,
    private val tokenStorage: TokenStorage
) {

    suspend fun submitReport(
        imageUri: Uri,
        latitude: Double,
        longitude: Double,
        markerCode: String
    ): Result<String> {
        return try {
            val token = tokenStorage.tokenFlow.first()
                ?: return Result.failure(Exception("認証情報がありません。再度ログインしてください"))

            if (token == "debug-token") return Result.success("debug-report-id")

            val imageFile = uriToFile(imageUri)
            val imagePart = MultipartBody.Part.createFormData(
                "image",
                imageFile.name,
                imageFile.asRequestBody("image/jpeg".toMediaTypeOrNull())
            )
            val latBody = latitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val lngBody = longitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val codeBody = markerCode.toRequestBody("text/plain".toMediaTypeOrNull())

            val response = ApiClient.apiService.createReport(
                token = "Bearer $token",
                image = imagePart,
                latitude = latBody,
                longitude = lngBody,
                markerCode = codeBody
            )

            if (response.isSuccessful) {
                Result.success(response.body()?.id ?: "")
            } else {
                Result.failure(Exception("通報に失敗しました (${response.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("通信エラー: ${e.message}"))
        }
    }

    private fun uriToFile(uri: Uri): File {
        val file = File(context.cacheDir, "upload_${System.currentTimeMillis()}.jpg")
        context.contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(file).use { output ->
                input.copyTo(output)
            }
        }
        return file
    }
}

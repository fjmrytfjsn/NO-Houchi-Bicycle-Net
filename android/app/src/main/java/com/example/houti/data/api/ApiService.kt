package com.example.houti.data.api

import com.example.houti.data.model.LoginRequest
import com.example.houti.data.model.LoginResponse
import com.example.houti.data.model.ReportResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface ApiService {

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @Multipart
    @POST("api/reports")
    suspend fun createReport(
        @Header("Authorization") token: String,
        @Part image: MultipartBody.Part,
        @Part("latitude") latitude: RequestBody,
        @Part("longitude") longitude: RequestBody,
        @Part("marker_code") markerCode: RequestBody
    ): Response<ReportResponse>
}

package com.example.houti.data.model

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: UserInfo
)

data class UserInfo(
    val id: String,
    val email: String,
    val role: String
)

data class ReportResponse(
    val id: String,
    val status: String,
    val createdAt: String
)

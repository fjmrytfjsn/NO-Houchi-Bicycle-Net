package com.example.houti.data.repository

import com.example.houti.data.api.ApiClient
import com.example.houti.data.local.TokenStorage
import com.example.houti.data.model.LoginRequest

class AuthRepository(private val tokenStorage: TokenStorage) {

    suspend fun debugLogin() {
        tokenStorage.saveToken("debug-token")
    }

    suspend fun logout() {
        tokenStorage.clearToken()
    }

    suspend fun login(email: String, password: String): Result<String> {
        return try {
            val response = ApiClient.apiService.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                val token = response.body()?.token
                    ?: return Result.failure(Exception("トークンを取得できませんでした"))
                tokenStorage.saveToken(token)
                Result.success(token)
            } else {
                Result.failure(Exception("ログインに失敗しました (${response.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("通信エラー: ${e.message}"))
        }
    }
}

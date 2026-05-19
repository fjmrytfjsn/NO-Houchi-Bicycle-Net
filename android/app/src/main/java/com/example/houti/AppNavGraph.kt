package com.example.houti

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.houti.data.local.TokenStorage
import com.example.houti.data.repository.AuthRepository
import com.example.houti.data.repository.ReportRepository
import com.example.houti.ui.home.HomeScreen
import com.example.houti.ui.home.HomeViewModel
import com.example.houti.ui.login.LoginScreen
import com.example.houti.ui.login.LoginViewModel
import com.example.houti.ui.report.ReportCompleteScreen
import com.example.houti.ui.report.ReportScreen
import com.example.houti.ui.report.ReportViewModel

object Routes {
    const val LOGIN = "login"
    const val HOME = "home"
    const val REPORT = "report"
    const val REPORT_COMPLETE = "report_complete"
}

@Composable
fun AppNavGraph(
    navController: NavHostController,
    context: Context
) {
    val tokenStorage = remember { TokenStorage(context) }
    val authRepository = remember { AuthRepository(tokenStorage) }
    val reportRepository = remember { ReportRepository(context, tokenStorage) }

    NavHost(navController = navController, startDestination = Routes.LOGIN) {

        composable(Routes.LOGIN) {
            val viewModel = remember { LoginViewModel(authRepository) }
            LoginScreen(
                viewModel = viewModel,
                onLoginSuccess = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.HOME) {
            val viewModel = remember { HomeViewModel(authRepository) }
            HomeScreen(
                viewModel = viewModel,
                onReportClick = { navController.navigate(Routes.REPORT) },
                onLogout = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.REPORT) {
            val viewModel = remember { ReportViewModel(reportRepository, context) }
            ReportScreen(
                viewModel = viewModel,
                onReportComplete = {
                    navController.navigate(Routes.REPORT_COMPLETE) {
                        popUpTo(Routes.REPORT) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.REPORT_COMPLETE) {
            ReportCompleteScreen(
                onBackToHome = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.HOME) { inclusive = false }
                        launchSingleTop = true
                    }
                }
            )
        }
    }
}

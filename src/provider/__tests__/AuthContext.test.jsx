import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import * as userApi from "../../api/userApi";

// Mock modules
vi.mock("../../api/authApi", () => ({
  userLogin: vi.fn(),
  userLogout: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("../../api/userApi", () => ({
  getUserInfo: vi.fn(),
  register: vi.fn(),
}));

vi.mock("../../components/FoxCharacter/FoxCharacter", () => ({
  Messages: {
    LOGIN: "LOGIN",
    LOGIN_FAIL: "LOGIN_FAIL",
    AFTER_SIGNUP_SUCCESS: "SIGNUP_SUCCESS",
    USERNAME_EXIST: "USERNAME_EXIST",
    EMAIL_EXIST: "EMAIL_EXIST",
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Import after mock
import AuthProvider, { useAuth } from "../AuthContext";
import { userLogin, userLogout, refreshToken } from "../../api/authApi";
import { getUserInfo, register } from "../../api/userApi";

// Test component
function TestRegisterComponent() {
  const { userRegister, message } = useAuth();
  return (
    <div>
      <p data-testid="message">{message}</p>
      <button
        onClick={() =>
          userRegister({ username: "fox", email: "fox@example.com" })
        }
      >
        Register
      </button>
    </div>
  );
}

function TestLoadingComponent() {
  const { login, userRegister, loading } = useAuth();
  return (
    <div>
      <p data-testid="loading">{loading ? "true" : "false"}</p>
      <button onClick={() => login({ username: "a", password: "b" })}>
        Login
      </button>
      <button
        onClick={() =>
          userRegister({ username: "fox", email: "fox@example.com" })
        }
      >
        Register
      </button>
    </div>
  );
}

function TestComponent() {
  const { authenticated, login, logout, message, jwt, userInfo } = useAuth();
  return (
    <div>
      <p data-testid="auth">{authenticated ? "yes" : "no"}</p>
      <p data-testid="message">{message}</p>
      <p data-testid="jwt">{jwt || "none"}</p>
      <p data-testid="username">{userInfo?.name || "guest"}</p>

      <button onClick={() => login({ username: "a", password: "b" })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Test cases
describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("Renders with default values", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth")).toHaveTextContent("no");
    expect(screen.getByTestId("jwt")).toHaveTextContent("none");
    expect(screen.getByTestId("username")).toHaveTextContent("guest");
  });

  test("Login success updates state and navigates", async () => {
    userLogin.mockResolvedValue({
      data: { authenticated: true, token: "abc123" },
    });
    getUserInfo.mockResolvedValue({ data: { name: "User001" } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText("Login").click();
    });

    await waitFor(() => {
      expect(userLogin).toHaveBeenCalled();
      expect(getUserInfo).toHaveBeenCalledWith("abc123");
      expect(screen.getByTestId("auth")).toHaveTextContent("yes");
      expect(screen.getByTestId("jwt")).toHaveTextContent("abc123");
      expect(screen.getByTestId("username")).toHaveTextContent("User001");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("Logout resets state", async () => {
    localStorage.setItem("jwt", "abc123");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText("Logout").click();
    });

    expect(screen.getByTestId("auth")).toHaveTextContent("no");
    expect(screen.getByTestId("jwt")).toHaveTextContent("none");
    expect(screen.getByTestId("username")).toHaveTextContent("guest");
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("Login failure sets message to LOGIN_FAIL", async () => {
    userLogin.mockResolvedValue({ data: { authenticated: false } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText("Login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("message")).toHaveTextContent("LOGIN_FAIL");
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test("Login throws error still sets failure message", async () => {
    userLogin.mockRejectedValue(new Error("Network error"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => screen.getByText("Login").click());

    await waitFor(() => {
      expect(screen.getByTestId("message")).toHaveTextContent("LOGIN_FAIL");
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
    });
  });

  test("userRegister success sets message to SIGNUP_SUCCESS", async () => {
    register.mockResolvedValue({ statusCode: 0 });

    render(
      <AuthProvider>
        <TestRegisterComponent />
      </AuthProvider>
    );

    await act(async () => screen.getByText("Register").click());

    await waitFor(() => {
      expect(register).toHaveBeenCalled();
      expect(screen.getByTestId("message")).toHaveTextContent("SIGNUP_SUCCESS");
    });
  });

  test("userRegister fail with username exists sets message to USERNAME_EXIST", async () => {
    userApi.register.mockRejectedValue({
      response: { data: { statusCode: 1002 } },
    });

    render(
      <AuthProvider>
        <TestRegisterComponent />
      </AuthProvider>
    );

    await act(async () => screen.getByText("Register").click());

    await waitFor(() => {
      expect(screen.getByTestId("message")).toHaveTextContent(
        "USERNAME_EXIST"
      );
    });
  });

  test("userRegister fail with email exists sets message to EMAIL_EXIST", async () => {
    register.mockRejectedValue({
      response: { data: { statusCode: 2004 } },
    });

    render(
      <AuthProvider>
        <TestRegisterComponent />
      </AuthProvider>
    );

    await act(async () => screen.getByText("Register").click());

    await waitFor(() => {
      expect(screen.getByTestId("message")).toHaveTextContent("EMAIL_EXIST");
    });
  });

  test("Login sets loading true during API call and false after", async () => {
    userLogin.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ data: { authenticated: true, token: "abc123" } }),
            50
          )
        )
    );
    getUserInfo.mockResolvedValue({ data: { name: "User001" } });

    render(
      <AuthProvider>
        <TestLoadingComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("false");

    act(() => screen.getByText("Login").click());
    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
  });

  test("userRegister sets loading true during API call and false after", async () => {
    register.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ statusCode: 0 }), 50))
    );

    render(
      <AuthProvider>
        <TestLoadingComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("false");

    act(() => screen.getByText("Register").click());
    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
  });

  test("Auto logout if JWT is invalid or getUserInfo fails", async () => {
    getUserInfo.mockRejectedValue(new Error("401 Unauthorized"));
    localStorage.setItem("jwt", "invalid_jwt_token");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getUserInfo).toHaveBeenCalledWith("invalid_jwt_token");
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
      expect(screen.getByTestId("jwt")).toHaveTextContent("none");
      expect(screen.getByTestId("username")).toHaveTextContent("guest");
      expect(screen.getByTestId("message")).toHaveTextContent("LOGIN");
    });
  });
});
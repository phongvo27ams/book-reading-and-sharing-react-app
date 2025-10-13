import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import LoginPage from "../LoginPage";
import { Messages } from "../../../components/FoxCharacter/FoxCharacter";

// Mock useAuth
let mockLogin = vi.fn();
let mockSetMessage = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
    setMessage: mockSetMessage,
    loading: false,
  }),
}));

vi.mock("../../../provider/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
    setMessage: mockSetMessage,
  }),
}));

// Mock assets
vi.mock("../../assets/fox.png", () => "fox.png");
vi.mock("../../assets/google.png", () => "google.png");
vi.mock("../../assets/facebook.png", () => "facebook.png");

describe("Component LoginPage: Core Functionality and Validation", () => {
  beforeEach(() => {
    mockLogin = vi.fn();
    mockSetMessage = vi.fn();
    vi.clearAllMocks();
  });

  const invalidUsernames = [
    "short",
    "a".repeat(33),
    "user!",
    "user@name",
    "user name",
  ];

  const validUsernames = [
    "user123",
    "User_01",
    "username32characterslonggg",
  ];

  const invalidPasswords = [
    "short",
    "a".repeat(33),
    "abcdefgh",
    "12345678",
    "!!!!!!!!",
    "abcde123",
    "Abc!@#",
    "A1!@#",
    "pass word1!",
  ];

  const validPasswords = [
    "Abcd23!",
    "Password1@",
    "Aa1!@#$%^&*",
    "Zx9_@1234",
  ];

  // --------------------
  describe("Rendering and Initialization", () => {
    test("SHOULD render all required form elements and links WHEN the component mounts", () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(screen.getByText("LOGIN")).toBeInTheDocument();
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByText(/Join the Base/i)).toBeInTheDocument();
      expect(screen.getByText(/Forgot password/i)).toBeInTheDocument();
      expect(screen.getByText(/Become a Fox/i)).toBeInTheDocument();
    });

    test("SHOULD initialize the message state with the default LOGIN message WHEN the component mounts", () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.LOGIN);
    });
  });

  // --------------------
  describe("Validation", () => {
    test.each(invalidUsernames)(
      "Rejects invalid username: '%s'",
      async (username) => {
        render(
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        );

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByText(/Join the Base/i);

        fireEvent.change(usernameInput, { target: { value: username } });
        fireEvent.change(passwordInput, { target: { value: "ValidPass1!" } });
        fireEvent.click(loginButton);

        await waitFor(() => {
          expect(mockLogin).not.toHaveBeenCalled();
          expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
        });
      }
    );

    test.each(validUsernames)(
      "Accepts valid username: '%s'",
      async (username) => {
        mockLogin.mockResolvedValue(true);
        render(
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        );

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByText(/Join the Base/i);

        fireEvent.change(usernameInput, { target: { value: username } });
        fireEvent.change(passwordInput, { target: { value: "ValidPass1!" } });
        fireEvent.click(loginButton);

        await waitFor(() => {
          expect(mockLogin).toHaveBeenCalledWith({
            username,
            password: "ValidPass1!",
          });
        });
      }
    );

    test.each(invalidPasswords)(
      "Rejects invalid password: '%s'",
      async (password) => {
        render(
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        );

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByText(/Join the Base/i);

        fireEvent.change(usernameInput, { target: { value: "ValidUser" } });
        fireEvent.change(passwordInput, { target: { value: password } });
        fireEvent.click(loginButton);

        await waitFor(() => {
          expect(mockLogin).not.toHaveBeenCalled();
          expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
        });
      }
    );

    test.each(validPasswords)(
      "Accepts valid password: '%s'",
      async (password) => {
        mockLogin.mockResolvedValue(true);
        render(
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        );

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByText(/Join the Base/i);

        fireEvent.change(usernameInput, { target: { value: "ValidUser" } });
        fireEvent.change(passwordInput, { target: { value: password } });
        fireEvent.click(loginButton);

        await waitFor(() => {
          expect(mockLogin).toHaveBeenCalledWith({
            username: "ValidUser",
            password,
          });
        });
      }
    );
  });

  // --------------------
  describe("Login Logic", () => {
    test("SHOULD call the login API AND clear inputs WHEN authentication is successful", async () => {
      mockLogin.mockResolvedValue(true);
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);

      fireEvent.change(usernameInput, { target: { value: "user001" } });
      fireEvent.change(passwordInput, { target: { value: "password@001" } });
      fireEvent.click(screen.getByText(/Join the Base/i));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: "user001",
          password: "password@001",
        });
        expect(usernameInput.value).toBe("");
        expect(passwordInput.value).toBe("");
      });
    });

    test("SHOULD call the login API AND RETAIN inputs WHEN authentication Fails", async () => {
      mockLogin.mockResolvedValue(false);
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);

      fireEvent.change(usernameInput, { target: { value: "user001" } });
      fireEvent.change(passwordInput, { target: { value: "password@001" } });
      fireEvent.click(screen.getByText(/Join the Base/i));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: "user001",
          password: "password@001",
        });
        expect(usernameInput.value).toBe("user001");
        expect(passwordInput.value).toBe("password@001");
      });
    });
  });

  // --------------------
  describe("Edge Cases", () => {
    test("SHOULD call the BLANK message handler AND block login WHEN both Username and Password fields are left empty", async () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText(/Join the Base/i));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
        expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
      });
    });

    test("SHOULD call the BLANK message handler AND block login WHEN both inputs contain only whitespace", async () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);

      fireEvent.change(usernameInput, { target: { value: "   " } });
      fireEvent.change(passwordInput, { target: { value: "   " } });
      fireEvent.click(screen.getByText(/Join the Base/i));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
        expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
      });
    });

    test("SHOULD call the BLANK message handler ONLY ONCE WHEN the login button is rapidly clicked with empty inputs", async () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const loginButton = screen.getByText(/Join the Base/i);
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
        expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
      });
    });

    test("SHOULD call the login API ONLY ONCE WHEN the login button is rapidly clicked with valid credentials", async () => {
      mockLogin = vi.fn(() => new Promise((r) => setTimeout(() => r(true), 50)));
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByText(/Join the Base/i);

      fireEvent.change(usernameInput, { target: { value: "user001" } });
      fireEvent.change(passwordInput, { target: { value: "password@001" } });
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });
    });
  });

  // --------------------
  describe("Navigation & Loading State", () => {
    test("SHOULD navigate to the correct path AND set the corresponding message WHEN a navigation link is clicked", () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const createAccountLink = screen.getByText(/Become a Fox/i).closest("a");
      fireEvent.click(createAccountLink);
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.SIGNUP);

      const forgotLink = screen.getByText(/Forgot password/i).closest("a");
      expect(forgotLink).toHaveAttribute("href", "/auth/reset-password");
    });

    test("SHOULD display the loading indicator WHEN the authentication process is active", () => {
      vi.mock("../../../provider/AuthContext", () => ({
        useAuth: () => ({
          login: mockLogin,
          loading: true,
          setMessage: mockSetMessage,
        }),
      }));

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const loaderContainer = screen.getByText(/Join the Base/i).closest("form");
      expect(loaderContainer).toBeInTheDocument();
    });
  });
});
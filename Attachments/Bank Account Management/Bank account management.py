class Account:
    def __init__(self, acc_number, name, pin, balance=0):
        self.acc_number = acc_number
        self.name = name
        self.pin = pin
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            raise Exception("Insufficient Balance.")
        self.balance -= amount

    def __str__(self):
        return f"Account[{self.acc_number}] - {self.name}: Balance = {self.balance}"


def load_accounts(filename):
    accounts = {}
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = [p.strip() for p in line.split(',')]
                if len(parts) != 4:
                    continue

                acc_number, name, pin, balance = parts
                accounts[acc_number] = Account(acc_number, name, pin, float(balance))
    except FileNotFoundError:
        pass
    return accounts


def save_accounts(filename, accounts):
    with open(filename, 'w') as f:
        for acc in accounts.values():
            f.write(f"{acc.acc_number},{acc.name},{acc.pin},{acc.balance}\n")


def find_account(accounts, acc_number):
    if acc_number not in accounts:
        raise Exception("Account Not Found.")
    return accounts[acc_number]


def verify_pin(account):
    entered_pin = input("Enter 4-digit PIN: ")
    if entered_pin != account.pin:
        raise Exception("Incorrect PIN.")
    return True


def main():
    filename = "accounts.txt"
    accounts = load_accounts(filename)

    while True:
        print("\n1. Create Account\n2. Deposit\n3. Withdraw\n4. View All Accounts")
        print("5. Delete Account\n6. Exit")

        try:
            choice = int(input("Enter choice: "))

            if choice == 1:
                acc_number = input("Enter 12-digit account number: ")

                if len(acc_number) != 12 or not acc_number.isdigit():
                    print("Invalid Account Number! Must be exactly 12 digits.")
                    continue

                name = input("Enter name: ")
                pin = input("Set a 4-digit PIN: ")

                if len(pin) != 4 or not pin.isdigit():
                    print("Invalid PIN! Must be exactly 4 digits.")
                    continue

                if acc_number in accounts:
                    print("Account Already Exists.")
                else:
                    accounts[acc_number] = Account(acc_number, name, pin)
                    print("Account created successfully.")

            
            elif choice == 2:
                acc_number = input("Enter account number: ")
                acc = find_account(accounts, acc_number)
                verify_pin(acc)

                amt = float(input("Enter amount to deposit: "))
                acc.deposit(amt)

                print("Deposit successful.")

            
            elif choice == 3:
                acc_number = input("Enter account number: ")
                acc = find_account(accounts, acc_number)
                verify_pin(acc)

                amt = float(input("Enter amount to withdraw: "))
                acc.withdraw(amt)

                print("Withdrawal successful.")

            
            elif choice == 4:
                for acc in accounts.values():
                    print(acc)

            elif choice == 5:
                acc_number = input("Enter account number to delete: ")

                if acc_number in accounts:
                    acc = accounts[acc_number]

                    try:
                        verify_pin(acc)
                    except:
                        print("Incorrect PIN. Deletion failed.")
                        continue

                    confirm = input(f"Are you sure you want to delete account {acc_number}? (y/n): ")
                    if confirm.lower() == 'y':
                        del accounts[acc_number]
                        save_accounts(filename, accounts)
                        print("Account deleted successfully.")
                    else:
                        print("Deletion cancelled.")
                else:
                    print("Account Not Found.")

            
            elif choice == 6:
                save_accounts(filename, accounts)
                print("Thank you for using the Bank Account Management System!")
                break

            else:
                print("Invalid Choice.")

        except Exception as e:
            print("Error:", e)


if __name__ == "__main__":
    main()



import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("accounts.txt", names=["Account", "Name", "PIN", "Balance"])
df["Balance"] = df["Balance"].astype(float)

plt.bar(df["Name"], df["Balance"])
plt.title("Account Balances")
plt.xlabel("Account Holder")
plt.ylabel("Balance")
plt.show()


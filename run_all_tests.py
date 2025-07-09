import subprocess
import sys
import os

# Script pour exécuter tous les tests pytest du dossier simple-fastapi, quel que soit le dossier courant

def run_all_tests():
    base = os.path.dirname(os.path.abspath(__file__))
    test_dir = os.path.join(base, "simple-fastapi")
    print(f"Exécution de tous les tests pytest dans {test_dir} ...")
    result = subprocess.run([sys.executable, '-m', 'pytest', test_dir], capture_output=True, text=True)
    print(result.stdout)
    if result.returncode == 0:
        print("\nTous les tests sont PASSÉS !")
    else:
        print("\nDes tests ont ÉCHOUÉ. Voir ci-dessus.")
    return result.returncode

if __name__ == "__main__":
    exit(run_all_tests())

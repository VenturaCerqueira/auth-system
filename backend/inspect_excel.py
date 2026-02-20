import pandas as pd
import sys
import os

# Add current directory to path
sys.path.append('.')

def safe_float(value):
    try:
        if pd.isna(value):
            return 0.0
        if isinstance(value, str):
            # Handle Brazilian number format: remove dots and replace comma with dot
            value = value.replace('.', '').replace(',', '.')
        return float(value)
    except (ValueError, TypeError):
        return 0.0

print("Current working directory:", os.getcwd())

try:
    # Try relative path
    excel_file = '../frontend/app/fotos/Custos e Despesas - RxO Detalhado MBA_79_4362278567806326751 (1).xlsx'
    print(f"Trying path: {excel_file}")
    print(f"Absolute path: {os.path.abspath(excel_file)}")

    if not os.path.exists(excel_file):
        print(f"File not found: {excel_file}")
        # Try absolute path
        excel_file = 'd:/vscode/metric/auth-system/frontend/app/fotos/Custos e Despesas - RxO Detalhado MBA_79_4362278567806326751 (1).xlsx'
        print(f"Trying absolute path: {excel_file}")
        if not os.path.exists(excel_file):
            print(f"Absolute path also not found: {excel_file}")
            sys.exit(1)

    xl = pd.ExcelFile(excel_file)
    print('Sheets:', xl.sheet_names)

    # Focus on the relevant sheet
    sheet = 'Real x Orçado'
    if sheet in xl.sheet_names:
        df = pd.read_excel(excel_file, sheet_name=sheet, header=0)
        print(f'\nSheet: {sheet}')
        print('Original Columns:', list(df.columns))
        print('Original Sample data:')
        print(df.head(5))

        # Process as in main.py
        df = df.iloc[:, 1:]  # Drop first NaN column
        df.columns = ['Ano', 'Mês', 'Mercado', 'Núcleo', 'Micro Núcleo', 'Departamento', 'Filial', 'Código Micro Mercado ou UC', 'Micro Mercado ou UC', 'Custos FPO (novo)', 'Custos FPMSVO', 'Custos FPMSVO Executivo', 'Código Conta Gerencial', 'Conta Gerencial', 'Código da Conta Contábil', 'Conta Contabil', 'VA', 'Vlr Orçado', 'Valor DRE', 'Pacote', 'Subpacote']

        print('Processed Columns:', list(df.columns))
        print('Processed Sample data:')
        print(df.head(10))

        # Check for specific columns
        if 'Vlr Orçado' in df.columns:
            print(f"Vlr Orçado values: {df['Vlr Orçado'].dropna().head()}")
        if 'Valor DRE' in df.columns:
            print(f"Valor DRE values: {df['Valor DRE'].dropna().head()}")

        # Simulate processing
        fato_orcamento_data = []
        fato_realizado_data = []

        for index, record in enumerate(df.to_dict('records')):
            try:
                ano = int(float(record.get('Ano', 0))) if pd.notna(record.get('Ano', 0)) else 0
            except (ValueError, TypeError):
                ano = 0

            try:
                mes = int(float(record.get('Mês', 0))) if pd.notna(record.get('Mês', 0)) else 0
            except (ValueError, TypeError):
                mes = 0

            vlrOrcado = safe_float(record.get('Vlr Orçado', 0))
            valorDRE = safe_float(record.get('Valor DRE', 0))

            if ano > 0 and mes > 0:
                data_str = f"{ano}-{mes:02d}-01"

                # Process orçamento data (Vlr Orçado)
                if vlrOrcado != 0:
                    fato_orcamento_data.append({
                        'id': f"orc_{index}",
                        'ano': ano,
                        'mes': mes,
                        'data': data_str,
                        'codigoMicroMercado': str(record.get('Código Micro Mercado ou UC', '')),
                        'codigoConta': str(record.get('Código da Conta Contábil', '')),
                        'vlrOrcado': vlrOrcado
                    })

                # Process realizado data (Valor DRE)
                if valorDRE != 0:
                    fato_realizado_data.append({
                        'id': f"real_{index}",
                        'ano': ano,
                        'mes': mes,
                        'data': data_str,
                        'codigoMicroMercado': str(record.get('Código Micro Mercado ou UC', '')),
                        'codigoConta': str(record.get('Código da Conta Contábil', '')),
                        'razaoSocial': str(record.get('Conta Gerencial', '')) or 'Fornecedor',
                        'valorCustoTotal': valorDRE,
                        'historicoCusto': f"{record.get('Departamento', '')} - {record.get('Pacote', '')} - {record.get('Subpacote', '')}"
                    })

        print(f"\nProcessed {len(fato_orcamento_data)} orçamento records")
        print(f"Processed {len(fato_realizado_data)} realizado records")

        if fato_orcamento_data:
            print("Sample orçamento record:", fato_orcamento_data[0])
        if fato_realizado_data:
            print("Sample realizado record:", fato_realizado_data[0])

        print('\n' + '='*50)

except Exception as e:
    print('Error:', str(e))
    import traceback
    traceback.print_exc()

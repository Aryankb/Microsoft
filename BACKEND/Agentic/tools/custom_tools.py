import subprocess


def code_runner(code: str,lang: str) -> str:
    if lang == "python":
        # Save the code to a file
        with open("script.py", "w") as f:
            f.write(code)

        # Run the script using subprocess
        result = subprocess.run(["python3", "script.py"], capture_output=True, text=True)
        try:
            subprocess.run(["rm", "script.py"], check=True)
            print("File deleted successfully.")
        except subprocess.CalledProcessError as e:
            print(f"Error occurred: {e}")
        except FileNotFoundError:
            print("The file does not exist.")
        return result.stdout
    




from duckduckgo_search import DDGS


def duckduckgo_search(query, max_results=5):
    """
    Perform a DuckDuckGo search and return the results.

    Args:
        query (str): The search query.
        max_results (int): Maximum number of results to return.

    Returns:
        list: A list of dictionaries containing search results.
    """
    try:
        # Perform the search
        results = DDGS().text('ai engineering roadmap', region='wt-wt', safesearch='off', timelimit='y', max_results=10)
        return results
    except Exception as e:
        print(f"An error occurred during the search: {e}")
        return []
    




# Example usage
if __name__ == "__main__": 
    #search links
    # query = "latest bitcoin price"
    # search_results = print(duckduckgo_search(query, max_results=5))



    # search video results


    results = DDGS().videos(
    keywords="ai engineering roadmap",
    region="wt-wt",
    safesearch="off",
    timelimit="w",
    resolution="high",
    duration="medium",
    max_results=5,
    )
    print(results)

    
#     # search image results




#     results = DDGS().images(
#     keywords="butterfly",
#     region="wt-wt",
#     safesearch="off",
#     size=None,
#     color="Monochrome",
#     type_image=None,
#     layout=None,
#     license_image=None,
#     max_results=100,
# )
#     print(results)






# # news search
#     results = DDGS().news(keywords="sun", region="wt-wt", safesearch="off", timelimit="m", max_results=20)
#     print(results)







# cats dogs	Results about cats or dogs
# "cats and dogs"	Results for exact term "cats and dogs". If no results are found, related results are shown.



# cats filetype:pdf	PDFs about cats. Supported file types: pdf, doc(x), xls(x), ppt(x), html
# dogs site:example.com	Pages about dogs from example.com
# cats -site:example.com	Pages about cats, excluding example.com